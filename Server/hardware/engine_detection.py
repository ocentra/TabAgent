"""
Inference engine and acceleration backend detection for TabAgent.

Detects available inference engines and hardware acceleration capabilities:
- CUDA (NVIDIA)
- Vulkan (Cross-platform)
- ROCm (AMD)
- Metal (Apple)
- DirectML (Windows)
"""

import subprocess
import logging
import importlib.util
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass

from core.message_types import AccelerationBackend


logger = logging.getLogger(__name__)


class EngineType(str, Enum):
    """Inference engine types"""
    LLAMA_CPP = "llama_cpp"
    ONNX_RUNTIME = "onnx_runtime"
    TRANSFORMERS = "transformers"
    BITNET = "bitnet"


class EngineAvailability(str, Enum):
    """Engine availability status"""
    AVAILABLE = "available"
    NOT_INSTALLED = "not_installed"
    MISSING_BACKEND = "missing_backend"
    ERROR = "error"


class BackendDetectionMethod(str, Enum):
    """Methods used to detect backends"""
    PYTORCH_CUDA = "pytorch_cuda"
    VULKAN_INFO = "vulkan_info"
    ROCM_SMI = "rocm_smi"
    METAL_COMMAND = "metal_command"
    ONNX_PROVIDERS = "onnx_providers"
    BINARY_CHECK = "binary_check"


@dataclass(frozen=True)
class EngineInfo:
    """
    Information about an available inference engine.
    
    Attributes:
        engine_type: Type of engine
        backend: Acceleration backend it supports
        available: Whether it's available
        version: Version string if detected
        binary_path: Path to binary if applicable
        error: Error message if not available
    """
    engine_type: EngineType
    backend: AccelerationBackend
    available: bool
    version: Optional[str] = None
    binary_path: Optional[str] = None
    error: Optional[str] = None


class AccelerationDetector:
    """
    Detects available hardware acceleration backends.
    
    This class checks for:
    - CUDA availability via PyTorch
    - Vulkan via vulkaninfo command
    - ROCm via rocm-smi
    - Metal via system checks (macOS)
    - DirectML via ONNX Runtime providers
    """
    
    def __init__(self):
        """Initialize acceleration detector"""
        self._cache: Dict[AccelerationBackend, bool] = {}
        logger.info("AccelerationDetector initialized")
    
    def detect_all(self) -> Dict[AccelerationBackend, bool]:
        """
        Detect all available acceleration backends.
        
        Returns:
            Dictionary mapping backend to availability
        """
        if self._cache:
            return self._cache.copy()
        
        backends = {
            AccelerationBackend.CPU: True,  # Always available
            AccelerationBackend.CUDA: self.has_cuda(),
            AccelerationBackend.VULKAN: self.has_vulkan(),
            AccelerationBackend.ROCM: self.has_rocm(),
            AccelerationBackend.METAL: self.has_metal(),
            AccelerationBackend.DIRECTML: self.has_directml(),
            AccelerationBackend.NPU: self.has_npu(),
        }
        
        self._cache = backends
        return backends.copy()
    
    def has_cuda(self) -> bool:
        """
        Check if CUDA is available.
        
        Uses PyTorch to detect CUDA availability.
        
        Returns:
            True if CUDA is available
        """
        if AccelerationBackend.CUDA in self._cache:
            return self._cache[AccelerationBackend.CUDA]
        
        try:
            import torch
            available = torch.cuda.is_available()
            if available:
                device_count = torch.cuda.device_count()
                logger.info(f"CUDA is available ({device_count} device(s))")
            return available
        except ImportError:
            logger.debug("PyTorch not installed, CUDA not available")
            return False
        except Exception as e:
            logger.warning(f"CUDA detection error: {e}")
            return False
    
    def has_vulkan(self) -> bool:
        """
        Check if Vulkan is available.
        
        Uses vulkaninfo command to detect Vulkan.
        
        Returns:
            True if Vulkan is available
        """
        if AccelerationBackend.VULKAN in self._cache:
            return self._cache[AccelerationBackend.VULKAN]
        
        try:
            result = subprocess.run(
                ["vulkaninfo", "--summary"],
                capture_output=True,
                timeout=5,
                check=False
            )
            available = result.returncode == 0
            if available:
                logger.info("Vulkan is available")
            return available
        except FileNotFoundError:
            logger.debug("vulkaninfo not found, Vulkan not available")
            return False
        except subprocess.TimeoutExpired:
            logger.warning("vulkaninfo timed out")
            return False
        except Exception as e:
            logger.warning(f"Vulkan detection error: {e}")
            return False
    
    def has_rocm(self) -> bool:
        """
        Check if ROCm is available.
        
        Uses rocm-smi command to detect ROCm.
        
        Returns:
            True if ROCm is available
        """
        if AccelerationBackend.ROCM in self._cache:
            return self._cache[AccelerationBackend.ROCM]
        
        try:
            result = subprocess.run(
                ["rocm-smi", "--showproductname"],
                capture_output=True,
                timeout=5,
                check=False
            )
            available = result.returncode == 0
            if available:
                logger.info("ROCm is available")
            return available
        except FileNotFoundError:
            logger.debug("rocm-smi not found, ROCm not available")
            return False
        except subprocess.TimeoutExpired:
            logger.warning("rocm-smi timed out")
            return False
        except Exception as e:
            logger.warning(f"ROCm detection error: {e}")
            return False
    
    def has_metal(self) -> bool:
        """
        Check if Metal is available.
        
        Metal is available on macOS systems with Apple Silicon or compatible GPUs.
        
        Returns:
            True if Metal is available
        """
        if AccelerationBackend.METAL in self._cache:
            return self._cache[AccelerationBackend.METAL]
        
        try:
            import platform
            system = platform.system()
            if system != "Darwin":  # macOS
                return False
            
            # Check for Metal framework
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True,
                timeout=5,
                check=False
            )
            
            if result.returncode == 0:
                output = result.stdout.decode('utf-8', errors='ignore')
                # Check if Metal is mentioned in output
                available = "Metal" in output or "Apple" in output
                if available:
                    logger.info("Metal is available")
                return available
            
            return False
        except Exception as e:
            logger.warning(f"Metal detection error: {e}")
            return False
    
    def has_directml(self) -> bool:
        """
        Check if DirectML is available.
        
        Uses ONNX Runtime to check for DirectML execution provider.
        
        Returns:
            True if DirectML is available
        """
        if AccelerationBackend.DIRECTML in self._cache:
            return self._cache[AccelerationBackend.DIRECTML]
        
        try:
            import onnxruntime as ort
            providers = ort.get_available_providers()
            available = "DmlExecutionProvider" in providers
            if available:
                logger.info("DirectML is available")
            return available
        except ImportError:
            logger.debug("ONNX Runtime not installed, DirectML not available")
            return False
        except Exception as e:
            logger.warning(f"DirectML detection error: {e}")
            return False
    
    def get_cuda_version(self) -> Optional[str]:
        """
        Get CUDA version if available.
        
        Returns:
            CUDA version string or None
        """
        if not self.has_cuda():
            return None
        
        try:
            import torch
            return torch.version.cuda
        except Exception as e:
            logger.warning(f"Could not get CUDA version: {e}")
            return None
    
    def get_vulkan_version(self) -> Optional[str]:
        """
        Get Vulkan version if available.
        
        Returns:
            Vulkan version string or None
        """
        if not self.has_vulkan():
            return None
        
        try:
            result = subprocess.run(
                ["vulkaninfo", "--summary"],
                capture_output=True,
                timeout=5,
                check=True,
                text=True
            )
            
            # Parse version from output
            for line in result.stdout.split('\n'):
                if "Vulkan Instance Version:" in line:
                    version = line.split(":")[-1].strip()
                    return version
            
            return None
        except Exception as e:
            logger.warning(f"Could not get Vulkan version: {e}")
            return None
    
    def has_npu(self) -> bool:
        """
        Check if NPU (Neural Processing Unit) is available.
        
        Detects AMD Ryzen AI NPU via:
        1. ONNX Runtime VitisAI provider (AMD NPU)
        2. ONNX Runtime DirectML provider on NPU-capable devices
        
        Returns:
            True if NPU is available
        """
        if AccelerationBackend.NPU in self._cache:
            return self._cache[AccelerationBackend.NPU]
        
        try:
            import onnxruntime as ort
            providers = ort.get_available_providers()
            
            # Check for VitisAI provider (AMD Ryzen AI NPU)
            if "VitisAIExecutionProvider" in providers:
                logger.info("AMD Ryzen AI NPU available (VitisAI)")
                return True
            
            # Check for DirectML on NPU-capable systems
            # DirectML can use NPU on AMD Ryzen AI systems
            if "DmlExecutionProvider" in providers:
                # Try to detect if this is actually an NPU system
                try:
                    import platform
                    if platform.system() == "Windows":
                        # Check for AMD NPU driver presence
                        import subprocess
                        result = subprocess.run(
                            [r"C:\Windows\System32\AMD\xrt-smi.exe", "examine"],
                            capture_output=True,
                            timeout=2,
                            check=False
                        )
                        if result.returncode == 0:
                            logger.info("AMD Ryzen AI NPU available (DirectML + xrt-smi)")
                            return True
                except Exception:
                    pass
            
            return False
            
        except ImportError:
            logger.debug("ONNX Runtime not installed, NPU not available")
            return False
        except Exception as e:
            logger.warning(f"NPU detection error: {e}")
            return False


class InferenceEngineDetector:
    """
    Detects available inference engines and their supported backends.
    
    This class checks for:
    - llama.cpp (various backends)
    - ONNX Runtime
    - Transformers.js
    - BitNet
    """
    
    def __init__(self):
        """Initialize inference engine detector"""
        self.acceleration_detector = AccelerationDetector()
        logger.info("InferenceEngineDetector initialized")
    
    def detect_all_engines(self) -> List[EngineInfo]:
        """
        Detect all available inference engines.
        
        Returns:
            List of EngineInfo objects
        """
        engines: List[EngineInfo] = []
        
        # Detect llama.cpp with different backends
        engines.extend(self._detect_llamacpp_engines())
        
        # Detect ONNX Runtime
        onnx_engine = self._detect_onnx_runtime()
        if onnx_engine:
            engines.append(onnx_engine)
        
        # Detect Transformers
        transformers_engine = self._detect_transformers()
        if transformers_engine:
            engines.append(transformers_engine)
        
        return engines
    
    def _detect_llamacpp_engines(self) -> List[EngineInfo]:
        """
        Detect llama.cpp engines with different backends.
        
        Returns:
            List of EngineInfo for llama.cpp variants
        """
        engines: List[EngineInfo] = []
        
        # Check for llama.cpp with CUDA
        if self.acceleration_detector.has_cuda():
            engines.append(EngineInfo(
                engine_type=EngineType.LLAMA_CPP,
                backend=AccelerationBackend.CUDA,
                available=True,
                version=self.acceleration_detector.get_cuda_version()
            ))
        
        # Check for llama.cpp with Vulkan
        if self.acceleration_detector.has_vulkan():
            engines.append(EngineInfo(
                engine_type=EngineType.LLAMA_CPP,
                backend=AccelerationBackend.VULKAN,
                available=True,
                version=self.acceleration_detector.get_vulkan_version()
            ))
        
        # Check for llama.cpp with ROCm
        if self.acceleration_detector.has_rocm():
            engines.append(EngineInfo(
                engine_type=EngineType.LLAMA_CPP,
                backend=AccelerationBackend.ROCM,
                available=True
            ))
        
        # Check for llama.cpp with Metal
        if self.acceleration_detector.has_metal():
            engines.append(EngineInfo(
                engine_type=EngineType.LLAMA_CPP,
                backend=AccelerationBackend.METAL,
                available=True
            ))
        
        # CPU is always available
        engines.append(EngineInfo(
            engine_type=EngineType.LLAMA_CPP,
            backend=AccelerationBackend.CPU,
            available=True
        ))
        
        return engines
    
    def _detect_onnx_runtime(self) -> Optional[EngineInfo]:
        """
        Detect ONNX Runtime availability.
        
        Returns:
            EngineInfo or None
        """
        try:
            import onnxruntime as ort
            version = ort.__version__
            
            # Determine best backend
            providers = ort.get_available_providers()
            
            if "CUDAExecutionProvider" in providers:
                backend = AccelerationBackend.CUDA
            elif "DmlExecutionProvider" in providers:
                backend = AccelerationBackend.DIRECTML
            else:
                backend = AccelerationBackend.CPU
            
            return EngineInfo(
                engine_type=EngineType.ONNX_RUNTIME,
                backend=backend,
                available=True,
                version=version
            )
        except ImportError:
            logger.debug("ONNX Runtime not installed")
            return None
        except Exception as e:
            logger.warning(f"ONNX Runtime detection error: {e}")
            return None
    
    def _detect_transformers(self) -> Optional[EngineInfo]:
        """
        Detect Transformers library availability.
        
        Returns:
            EngineInfo or None
        """
        try:
            spec = importlib.util.find_spec("transformers")
            if spec is None:
                return None
            
            import transformers
            version = transformers.__version__
            
            # Determine backend based on CUDA availability
            if self.acceleration_detector.has_cuda():
                backend = AccelerationBackend.CUDA
            else:
                backend = AccelerationBackend.CPU
            
            return EngineInfo(
                engine_type=EngineType.TRANSFORMERS,
                backend=backend,
                available=True,
                version=version
            )
        except ImportError:
            logger.debug("Transformers not installed")
            return None
        except Exception as e:
            logger.warning(f"Transformers detection error: {e}")
            return None
    
    def get_best_backend_for_model(self, model_type: str) -> Tuple[AccelerationBackend, bool]:
        """
        Get best available backend for a model type.
        
        Args:
            model_type: Type of model (bitnet, gguf, etc)
            
        Returns:
            Tuple of (backend, is_available)
        """
        backends = self.acceleration_detector.detect_all()
        
        # Priority order for different model types
        if model_type == "bitnet":
            priority = [
                AccelerationBackend.CUDA,
                AccelerationBackend.CPU
            ]
        else:
            priority = [
                AccelerationBackend.CUDA,
                AccelerationBackend.VULKAN,
                AccelerationBackend.ROCM,
                AccelerationBackend.METAL,
                AccelerationBackend.CPU
            ]
        
        for backend in priority:
            if backends.get(backend, False):
                return (backend, True)
        
        return (AccelerationBackend.CPU, True)

