"""
Pre-download Amazon Chronos model during Docker build
Chronos is much smaller and easier than Lag-Llama!
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_chronos_model():
    """Download Chronos model to local cache"""
    try:
        logger.info("=" * 70)
        logger.info("🚀 DOWNLOADING AMAZON CHRONOS MODEL...")
        logger.info("=" * 70)
        logger.info("")
        logger.info("📦 Model: amazon/chronos-t5-small")
        logger.info("💾 Size: ~200-500 MB (much smaller than Lag-Llama!)")
        logger.info("⏱️  Expected time: 2-10 minutes")
        logger.info("💾 Saving to: /root/.cache/huggingface/")
        logger.info("")
        
        from chronos import ChronosPipeline
        import torch
        
        # Download Chronos Small (best balance)
        model_size = os.getenv("CHRONOS_MODEL_SIZE", "small")
        model_path = f"amazon/chronos-t5-{model_size}"
        
        logger.info(f"📡 Downloading from: {model_path}")
        logger.info("⏳ Please wait...")
        
        # Download and cache the model
        device = "cpu"  # Use CPU for download
        pipeline = ChronosPipeline.from_pretrained(
            model_path,
            device_map=device,
            torch_dtype=torch.float32,
        )
        
        logger.info("")
        logger.info("=" * 70)
        logger.info("✅ CHRONOS MODEL DOWNLOADED SUCCESSFULLY!")
        logger.info("=" * 70)
        logger.info(f"📂 Model cached in: /root/.cache/huggingface/")
        logger.info("🚀 Future API calls will use cached model (fast!)")
        logger.info("")
        logger.info("Model info:")
        logger.info(f"  - Size: {model_size}")
        logger.info(f"  - Device: {device}")
        logger.info(f"  - Type: Amazon Chronos Transformer")
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
        logger.error("  - GitHub or Hugging Face is down")
        logger.error("  - Insufficient disk space")
        logger.error("")
        
        # Don't fail the build, just warn
        logger.warning("⚠️  Container will start but predictions may fail")
        logger.warning("⚠️  Model will be downloaded on first /predict call")
        return False

if __name__ == "__main__":
    success = download_chronos_model()
    sys.exit(0 if success else 0)  # Always exit 0 to not fail Docker build

