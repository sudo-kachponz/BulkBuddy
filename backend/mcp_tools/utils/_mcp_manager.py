import subprocess
import socket
import time
import os
import logging
import shlex
from typing import List, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)


class MCPProxyManager:
    """
    Manages MCP proxy sub-processes (one per port).

    Memory-safety notes
    -------------------
    * stdout/stderr are redirected to DEVNULL — no pipe buffer accumulates
      in kernel memory and no reader-thread is needed.  MCP proxy logs are
      intentionally discarded; PM2 / Gunicorn logs are sufficient.
    * stop_all / stop_process send SIGTERM then wait with a short timeout so
      zombie processes are reaped immediately.
    """

    _STOP_TIMEOUT = 5  # seconds to wait for graceful shutdown before SIGKILL

    def __init__(self):
        self._processes: Dict[int, subprocess.Popen] = {}  # port → process
        self._commands: Dict[int, str] = {}                 # port → full cmd

    # ── Internal helpers ──────────────────────────────────────────────

    def _build_env(self) -> dict:
        """Return os.environ copy with ~/.bun/bin prepended to PATH."""
        env = os.environ.copy()
        bun_path = os.path.abspath(os.path.expanduser("~/.bun/bin"))
        if bun_path not in env.get("PATH", ""):
            env["PATH"] = bun_path + os.pathsep + env.get("PATH", "")
        return env

    def _start_process(self, cmd: str) -> subprocess.Popen:
        """
        Spawn a single MCP proxy process.

        stdout/stderr → DEVNULL  (no pipe buffers, no reader threads)
        """
        return subprocess.Popen(
            shlex.split(cmd),
            shell=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=self._build_env(),
        )

    def _stop_process_obj(self, process: subprocess.Popen, port: int) -> None:
        """Terminate *process*, wait, then SIGKILL if still alive."""
        try:
            process.terminate()
            try:
                process.wait(timeout=self._STOP_TIMEOUT)
            except subprocess.TimeoutExpired:
                logger.warning("⚠️  Process on port %d did not stop in %ds — killing", port, self._STOP_TIMEOUT)
                process.kill()
                process.wait()
        except OSError:
            pass  # already dead

    def _extract_port(self, cmd: str) -> int | None:
        """Extract the --sse-port value from a command string."""
        for part in cmd.split():
            if part.startswith("--sse-port="):
                try:
                    return int(part.split("=")[1])
                except ValueError:
                    pass
        return None

    def _is_port_in_use(self, port: int) -> bool:
        """Return True if something is listening on *port*."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(("localhost", port)) == 0

    # ── Public API ────────────────────────────────────────────────────

    def start(self, arr_full_cmd: List[str]) -> None:
        """Start all MCP proxy processes from a list of full commands."""
        for cmd in arr_full_cmd:
            port = self._extract_port(cmd)
            if port is None:
                logger.warning("Could not extract port from command: %s", cmd)
                continue
            try:
                process = self._start_process(cmd)
                self._processes[port] = process
                self._commands[port] = cmd
                logger.info("✅ Started MCP proxy on port %d (PID %d)", port, process.pid)
            except Exception as e:
                logger.error("❌ Error starting process on port %d: %s", port, e, exc_info=True)

    def check_status(self) -> None:
        """Log whether each managed process is listening on its port."""
        for port in self._processes:
            if self._is_port_in_use(port):
                logger.info("✅ MCP proxy running on port %d", port)
            else:
                logger.warning("❌ MCP proxy NOT running on port %d", port)

    def stop_all(self) -> None:
        """Terminate and reap all managed processes."""
        for port, process in list(self._processes.items()):
            self._stop_process_obj(process, port)
            logger.info("🛑 Stopped MCP proxy on port %d", port)
        self._processes.clear()
        self._commands.clear()

    def stop_process(self, port: int) -> bool:
        """Stop the process on *port*. Returns True if it existed."""
        process = self._processes.pop(port, None)
        self._commands.pop(port, None)
        if process is None:
            return False
        self._stop_process_obj(process, port)
        logger.info("🛑 Stopped MCP proxy on port %d", port)
        return True

    def update_tools(self, tools_data: List[Dict[str, Any]]) -> Dict[str, list]:
        """
        Reconcile running processes with the desired *tools_data*.

        Returns a dict with keys: added, removed, unchanged, updated.
        """
        result: Dict[str, list] = {"added": [], "removed": [], "unchanged": [], "updated": []}

        # Build desired state: port → cmd
        new_commands: Dict[int, str] = {}
        for tool in tools_data:
            cmd = tool.get("full_cmd", "")
            if cmd:
                port = self._extract_port(cmd)
                if port:
                    new_commands[port] = cmd

        # Remove stale processes
        for port in set(self._commands) - set(new_commands):
            cmd = self._commands[port]
            self.stop_process(port)
            result["removed"].append({"port": port, "cmd": cmd})

        # Add or update
        for port, cmd in new_commands.items():
            if port not in self._commands:
                # New — start it
                try:
                    process = self._start_process(cmd)
                    self._processes[port] = process
                    self._commands[port] = cmd
                    result["added"].append({"port": port, "cmd": cmd})
                    logger.info("✅ Added MCP proxy on port %d (PID %d)", port, process.pid)
                except Exception as e:
                    logger.error("❌ Error adding process on port %d: %s", port, e)
                    result["added"].append({"port": port, "cmd": cmd, "error": str(e)})

            elif self._commands[port] != cmd:
                # Command changed — restart
                self.stop_process(port)
                try:
                    process = self._start_process(cmd)
                    self._processes[port] = process
                    self._commands[port] = cmd
                    result["updated"].append({"port": port, "cmd": cmd})
                    logger.info("🔄 Updated MCP proxy on port %d (PID %d)", port, process.pid)
                except Exception as e:
                    logger.error("❌ Error updating process on port %d: %s", port, e)
                    result["updated"].append({"port": port, "cmd": cmd, "error": str(e)})
            else:
                result["unchanged"].append({"port": port, "cmd": cmd})

        return result