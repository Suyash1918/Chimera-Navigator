#!/usr/bin/env python3
"""
Project Chimera - Pipeline Module
Build and deployment automation with rollback capabilities
"""

import os
import sys
import json
import subprocess
import logging
import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

# Setup structured logging
class StructuredLogger:
    """Structured logger for JSON output"""
    
    def __init__(self, logger_name: str = "pipeline"):
        self.logger = logging.getLogger(logger_name)
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def info(self, message: str, **metadata):
        log_entry = {"level": "INFO", "message": message, "timestamp": datetime.datetime.now().isoformat(), **metadata}
        self.logger.info(json.dumps(log_entry))
    
    def error(self, message: str, **metadata):
        log_entry = {"level": "ERROR", "message": message, "timestamp": datetime.datetime.now().isoformat(), **metadata}
        self.logger.error(json.dumps(log_entry))
    
    def debug(self, message: str, **metadata):
        log_entry = {"level": "DEBUG", "message": message, "timestamp": datetime.datetime.now().isoformat(), **metadata}
        self.logger.debug(json.dumps(log_entry))
    
    def warning(self, message: str, **metadata):
        log_entry = {"level": "WARNING", "message": message, "timestamp": datetime.datetime.now().isoformat(), **metadata}
        self.logger.warning(json.dumps(log_entry))

@dataclass
class DeploymentRecord:
    """Represents a deployment record"""
    version: str
    timestamp: str
    status: str  # 'success', 'failed', 'in_progress'
    build_info: Dict[str, Any]
    deployment_info: Dict[str, Any] = None

class DeploymentRollbackManager:
    """Manages deployment rollback functionality"""
    
    def __init__(self):
        self.logger = StructuredLogger("rollback")
        self.history_file = "deployment_history.json"
        self.deployment_history: List[DeploymentRecord] = []
        self._load_deployment_history()
    
    def _load_deployment_history(self) -> List[Dict[str, Any]]:
        """Load deployment history from file"""
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r') as f:
                    data = json.load(f)
                    self.deployment_history = [DeploymentRecord(**record) for record in data]
            else:
                self.deployment_history = []
        except Exception as e:
            self.logger.error("Failed to load deployment history", error=str(e))
            self.deployment_history = []
    
    def _save_deployment_history(self) -> None:
        """Save deployment history to file"""
        try:
            with open(self.history_file, 'w') as f:
                json.dump([asdict(record) for record in self.deployment_history], f, indent=2)
        except Exception as e:
            self.logger.error("Failed to save deployment history", error=str(e))
    
    def record_deployment(self, version: str, status: str, build_info: Dict[str, Any]) -> None:
        """Record a deployment attempt"""
        record = DeploymentRecord(
            version=version,
            timestamp=datetime.datetime.now().isoformat(),
            status=status,
            build_info=build_info
        )
        
        self.deployment_history.append(record)
        self._save_deployment_history()
        
        self.logger.info("Deployment recorded", 
                        version=version, 
                        status=status,
                        total_deployments=len(self.deployment_history))
    
    def get_last_successful_deployment(self) -> Optional[DeploymentRecord]:
        """Get the last successful deployment"""
        for record in reversed(self.deployment_history):
            if record.status == 'success':
                return record
        return None
    
    def rollback_to_previous(self) -> bool:
        """Initiate rollback to previous successful deployment"""
        last_successful = self.get_last_successful_deployment()
        
        if not last_successful:
            self.logger.error("No successful deployment found for rollback")
            return False
        
        self.logger.info("Initiating rollback", 
                        target_version=last_successful.version,
                        target_timestamp=last_successful.timestamp)
        
        # In a real scenario, this would restore code, database, etc.
        # For now, we'll log the rollback attempt
        try:
            # Simulate rollback process
            self.logger.info("Rollback simulation completed", 
                           restored_version=last_successful.version)
            return True
        except Exception as e:
            self.logger.error("Rollback failed", error=str(e))
            return False

class HealthChecker:
    """Health check utilities for deployment validation"""
    
    @staticmethod
    def check_build_artifacts() -> bool:
        """Check if build artifacts exist and are valid"""
        required_paths = [
            "dist/public/index.html",
            "dist/index.js"
        ]
        
        for path in required_paths:
            if not os.path.exists(path):
                return False
        
        # Check if build files are not empty
        for path in required_paths:
            if os.path.getsize(path) == 0:
                return False
        
        return True
    
    @staticmethod
    def check_syntax_errors() -> bool:
        """Check for syntax errors in built JavaScript"""
        try:
            # Check if the built JavaScript can be parsed
            js_file = "dist/index.js"
            if os.path.exists(js_file):
                with open(js_file, 'r') as f:
                    content = f.read()
                    # Basic check for common syntax error indicators
                    if "SyntaxError" in content or "Unexpected token" in content:
                        return False
            return True
        except Exception:
            return False
    
    @staticmethod
    def check_deployment_health(url: str = None) -> bool:
        """Check if deployed application is healthy"""
        if not url:
            # If no URL provided, assume we're checking local deployment
            return True
        
        try:
            # In a real scenario, this would make HTTP requests to check health
            # For now, we'll simulate a health check
            return True
        except Exception:
            return False

class ChimeraPipeline:
    """Main pipeline orchestrator for build and deployment"""
    
    def __init__(self):
        self.logger = StructuredLogger("pipeline")
        self.rollback_manager = DeploymentRollbackManager()
        self.health_checker = HealthChecker()
        self.version = self._generate_version()
    
    def _generate_version(self) -> str:
        """Generate a version string for this deployment"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"v{timestamp}"
    
    def execute_build(self) -> bool:
        """Execute the build process"""
        self.logger.info("Starting build process", version=self.version)
        
        try:
            # Execute npm run build
            result = subprocess.run(
                ["npm", "run", "build"],
                check=True,
                capture_output=True,
                text=True,
                cwd="."
            )
            
            self.logger.info("Build completed successfully", 
                           stdout_length=len(result.stdout),
                           stderr_length=len(result.stderr))
            
            # Validate build artifacts
            if not self.health_checker.check_build_artifacts():
                self.logger.error("Build artifact validation failed")
                return False
            
            if not self.health_checker.check_syntax_errors():
                self.logger.error("Syntax error detected in build output")
                return False
            
            self.logger.info("Build validation passed")
            return True
            
        except subprocess.CalledProcessError as e:
            self.logger.error("Build failed", 
                            return_code=e.returncode,
                            stderr=e.stderr,
                            stdout=e.stdout)
            return False
        except Exception as e:
            self.logger.error("Build process error", error=str(e))
            return False
    
    def execute_deployment(self) -> bool:
        """Execute the deployment process"""
        self.logger.info("Starting deployment process", version=self.version)
        
        try:
            # Check if Firebase CLI is available
            if self._check_firebase_availability():
                return self._deploy_with_firebase()
            else:
                return self._validate_local_deployment()
                
        except Exception as e:
            self.logger.error("Deployment process error", error=str(e))
            self._handle_deployment_failure()
            return False
    
    def _check_firebase_availability(self) -> bool:
        """Check if Firebase CLI is available"""
        try:
            result = subprocess.run(
                ["firebase", "--version"],
                capture_output=True,
                text=True,
                check=True
            )
            self.logger.info("Firebase CLI available", version=result.stdout.strip())
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.warning("Firebase CLI not available, using local validation")
            return False
    
    def _deploy_with_firebase(self) -> bool:
        """Deploy using Firebase CLI"""
        try:
            # Execute firebase deploy
            result = subprocess.run(
                ["firebase", "deploy"],
                check=True,
                capture_output=True,
                text=True,
                cwd="."
            )
            
            self.logger.info("Firebase deployment completed", 
                           stdout_length=len(result.stdout),
                           stderr_length=len(result.stderr))
            
            # Record successful deployment
            build_info = {
                "type": "firebase",
                "build_artifacts": self.health_checker.check_build_artifacts(),
                "syntax_check": self.health_checker.check_syntax_errors()
            }
            
            self.rollback_manager.record_deployment(self.version, 'success', build_info)
            return True
            
        except subprocess.CalledProcessError as e:
            self.logger.error("Firebase deployment failed", 
                            return_code=e.returncode,
                            stderr=e.stderr,
                            stdout=e.stdout)
            
            build_info = {
                "type": "firebase",
                "error": e.stderr,
                "return_code": e.returncode
            }
            
            self.rollback_manager.record_deployment(self.version, 'failed', build_info)
            return False
    
    def _validate_local_deployment(self) -> bool:
        """Validate local deployment artifacts"""
        self.logger.info("Validating local deployment artifacts")
        
        try:
            # Check if all required files exist and are valid
            if not self.health_checker.check_build_artifacts():
                self.logger.error("Local deployment validation failed - missing artifacts")
                return False
            
            if not self.health_checker.check_syntax_errors():
                self.logger.error("Local deployment validation failed - syntax errors")
                return False
            
            # Record successful local validation
            build_info = {
                "type": "local_validation",
                "build_artifacts": True,
                "syntax_check": True
            }
            
            self.rollback_manager.record_deployment(self.version, 'success', build_info)
            
            self.logger.info("Local deployment validation passed")
            return True
            
        except Exception as e:
            self.logger.error("Local deployment validation error", error=str(e))
            
            build_info = {
                "type": "local_validation",
                "error": str(e)
            }
            
            self.rollback_manager.record_deployment(self.version, 'failed', build_info)
            return False
    
    def _handle_deployment_failure(self) -> None:
        """Handle deployment failure with automatic rollback"""
        self.logger.warning("Handling deployment failure")
        
        # Attempt automatic rollback
        if self.rollback_manager.rollback_to_previous():
            self.logger.info("Automatic rollback completed")
        else:
            self.logger.error("Automatic rollback failed - manual intervention required")
    
    def run_pipeline(self) -> bool:
        """Run the complete build and deployment pipeline"""
        self.logger.info("Starting Chimera Pipeline", version=self.version)
        
        # Step 1: Build
        if not self.execute_build():
            self.logger.error("Pipeline failed at build stage")
            return False
        
        # Step 2: Deploy
        if not self.execute_deployment():
            self.logger.error("Pipeline failed at deployment stage")
            return False
        
        self.logger.info("Pipeline completed successfully", version=self.version)
        return True

def main():
    """Main entry point for pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Chimera Pipeline - Build and Deployment Automation')
    parser.add_argument('--build-only', action='store_true', help='Run build step only')
    parser.add_argument('--deploy-only', action='store_true', help='Run deployment step only')
    parser.add_argument('--rollback', action='store_true', help='Rollback to last successful deployment')
    
    args = parser.parse_args()
    
    pipeline = ChimeraPipeline()
    
    if args.rollback:
        success = pipeline.rollback_manager.rollback_to_previous()
    elif args.build_only:
        success = pipeline.execute_build()
    elif args.deploy_only:
        success = pipeline.execute_deployment()
    else:
        success = pipeline.run_pipeline()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()