import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the updated get_llms function
from backend.agent_boilerplate.boilerplate.utils.get_llms import get_llms

def test_qwen():
    print("Mencoba inisiasi model qwen-plus melalui get_llms...")
    
    try:
        # Panggil fungsi get_llms dengan model qwen
        llm = get_llms(model_name="qwen-plus")
        
        print("✓ Model berhasil diinisialisasi!\n")
        print("Mengirim pesan ke model...")
        
        # Test dengan pesan sederhana
        response = llm.invoke("Halo, perkenalkan dirimu dalam satu kalimat pendek.")
        
        print("\n=== Respons dari Qwen ===")
        print(response.content)
        print("=========================")
        
    except Exception as e:
        print(f"\n❌ Terjadi error: {e}")

if __name__ == "__main__":
    test_qwen()
