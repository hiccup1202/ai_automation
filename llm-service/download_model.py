"""
Pre-download Lag-Llama model during Docker build
This runs ONCE when container is built, not on every API call
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_lag_llama_model():
    """Download Lag-Llama model to local cache"""
    try:
        logger.info("=" * 70)
        logger.info("🚀 DOWNLOADING LAG-LLAMA MODEL...")
        logger.info("=" * 70)
        logger.info("")
        logger.info("⚠️  This will download 2-5 GB from Hugging Face")
        logger.info("⏱️  Expected time: 30 minutes - 4 hours")
        logger.info("💾 Saving to: /root/.cache/huggingface/")
        logger.info("")
        
        from transformers import AutoModelForCausalLM
        
        model_path = os.getenv("LAG_LLAMA_MODEL_PATH", "time-series-foundation-models/lag-llama")
        
        logger.info(f"📡 Downloading from: {model_path}")
        logger.info("⏳ Please wait...")
        
        # Download and cache the model
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            local_files_only=False,  # Download from internet
            trust_remote_code=True,
            cache_dir="/root/.cache/huggingface"
        )
        
        logger.info("")
        logger.info("=" * 70)
        logger.info("✅ MODEL DOWNLOADED SUCCESSFULLY!")
        logger.info("=" * 70)
        logger.info(f"📂 Model cached in: /root/.cache/huggingface/")
        logger.info("🚀 Future API calls will use cached model (fast!)")
        logger.info("")
        
        return True
        
    except Exception as e:
        logger.error("")
        logger.error("=" * 70)
        logger.error("❌ MODEL DOWNLOAD FAILED!")
        logger.error("=" * 70)
        logger.error(f"Error: {e}")
        logger.error("")
        logger.error("Possible reasons:")
        logger.error("  - No internet connection")
        logger.error("  - Hugging Face is down")
        logger.error("  - Insufficient disk space")
        logger.error("  - Model path incorrect")
        logger.error("")
        
        # Don't fail the build, just warn
        logger.warning("⚠️  Container will start but predictions may fail")
        logger.warning("⚠️  Model will be downloaded on first /predict call")
        return False

if __name__ == "__main__":
    success = download_lag_llama_model()
    sys.exit(0 if success else 0)  # Always exit 0 to not fail Docker build




