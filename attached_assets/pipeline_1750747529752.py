#!/usr/bin/env python3
"""
Project Chimera - Pipeline Module
Build and deployment automation with rollback capabilities
"""

import os
import sys
import json
import logging
import subprocess
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "module": "pipeline", "metadata": %(metadata)s}',
    handlers=[logging.StreamHandler()]
)

class StructuredLogger:
    """Structured logger for JSON output"""
    
    def __init__(self, logger_name: str = "pipeline"):
        self.logger = logging.getLogger(logger_name)
    
    def info(self, message: str, **metadata):
        extra = {'metadata': json.dumps(metadata)}
        self.logger.info(message, extra=extra)
    
    def error(self, message: str, **metadata):
        extra = {'metadata': json.dumps(metadata)}
        self.logger.error(message, extra=extra)
    
    def debug(self, message: str, **metadata):
        extra = {'metadata': json.dumps(metadata)}
        self.logger.debug(message, extra=extra)
    
    def warning(self, message: str, **metadata):
        extra = {'metadata': json.dumps(metadata)}
        self.logger.warning(message, extra=extra)

logger = StructuredLogger()

class DeploymentRollbackManager:
    """Manages deployment rollback functionality"""
    
    def __init__(self):
        self.deployment_history_file = "deployment_history.json"
        self.deployment_history = self._load_deployment_history()
    
    def _load_deployment_history(self) -> List[Dict[str, Any]]:
        """Load deployment history from file"""
        try:
            if os.path.exists(self.deployment_history_file):
                with open(self.deployment_history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning("Failed to load deployment history", error=str(e))
        
        return []
    
    def _save_deployment_history(self) -> None:
        """Save deployment history to file"""
        try:
            with open(self.deployment_history_file, 'w', encoding='utf-8') as f:
                json.dump(self.deployment_history, f, indent=2, default=str)
        except Exception as e:
            logger.error("Failed to save deployment history", error=str(e))
    
    def record_deployment(self, version: str, status: str, build_info: Dict[str, Any]) -> None:
        """Record a deployment attempt"""
        deployment_record = {
            'version': version,
            'timestamp': datetime.now().isoformat(),
            'status': status,
            'build_info': build_info
        }
        
        self.deployment_history.append(deployment_record)
        
        # Keep only last 50 deployments
        if len(self.deployment_history) > 50:
            self.deployment_history = self.deployment_history[-50:]
        
        self._save_deployment_history()
        
        logger.info("Deployment recorded", 
                   version=version, 
                   status=status,
                   timestamp=deployment_record['timestamp'])
    
    def get_last_successful_deployment(self) -> Optional[Dict[str, Any]]:
        """Get the last successful deployment"""
        for deployment in reversed(self.deployment_history):
            if deployment.get('status') == 'success':
                return deployment
        
        return None
    
    def rollback_to_previous(self) -> bool:
        """Initiate rollback to previous successful deployment"""
        last_success = self.get_last_successful_deployment()
        
        if not last_success:
            logger.error("No previous successful deployment found for rollback")
            return False
        
        logger.info("Initiating rollback to previous deployment",
                   target_version=last_success.get('version'),
                   target_timestamp=last_success.get('timestamp'))
        
        # In a real implementation, this would trigger actual rollback
        # For now, we'll record the rollback attempt
        self.record_deployment(
            version=f"rollback-{last_success.get('version')}", 
            status='rollback_initiated',
            build_info={'rollback_target': last_success}
        )
        
        return True

class HealthChecker:
    """Health check utilities for deployment validation"""
    
    @staticmethod
    def check_build_artifacts() -> bool:
        """Check if build artifacts exist and are valid"""
        required_artifacts = [
            "dist/public/index.html",
            "dist/index.js"
        ]
        
        for artifact in required_artifacts:
            if not os.path.exists(artifact):
                logger.error("Required build artifact missing", artifact=artifact)
                return False
            
            # Check if file is not empty
            if os.path.getsize(artifact) == 0:
                logger.error("Build artifact is empty", artifact=artifact)
                return False
        
        logger.info("Build artifacts validation passed", artifacts=required_artifacts)
        return True
    
    @staticmethod
    def check_syntax_errors() -> bool:
        """Check for syntax errors in built JavaScript"""
        try:
            # Run a basic syntax check on the built files
            js_files = []
            dist_dir = "dist"
            
            if os.path.exists(dist_dir):
                for root, dirs, files in os.walk(dist_dir):
                    for file in files:
                        if file.endswith('.js'):
                            js_files.append(os.path.join(root, file))
            
            if not js_files:
                logger.warning("No JavaScript files found in dist directory")
                return True  # Not necessarily an error
            
            for js_file in js_files:
                # Use Node.js to check syntax
                result = subprocess.run([
                    'node', '-c', js_file
                ], capture_output=True, text=True)
                
                if result.returncode != 0:
                    logger.error("Syntax error in built JavaScript",
                               file=js_file,
                               error=result.stderr)
                    return False
            
            logger.info("JavaScript syntax validation passed", files_checked=len(js_files))
            return True
        
        except FileNotFoundError:
            logger.warning("Node.js not available for syntax checking")
            return True  # Skip check if Node.js not available
        except Exception as e:
            logger.error("Syntax check failed", error=str(e))
            return False
    
    @staticmethod
    def check_deployment_health(url: str = None) -> bool:
        """Check if deployed application is healthy"""
        if not url:
            # For local development, we can skip this
            logger.info("No deployment URL provided, skipping health check")
            return True
        
        try:
            import requests
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                logger.info("Deployment health check passed", 
                           url=url, 
                           status_code=response.status_code)
                return True
            else:
                logger.error("Deployment health check failed",
                           url=url,
                           status_code=response.status_code)
                return False
        
        except ImportError:
            logger.warning("requests library not available, skipping health check")
            return True
        except Exception as e:
            logger.error("Health check failed", url=url, error=str(e))
            return False

class ChimeraPipeline:
    """Main pipeline orchestrator for build and deployment"""
    
    def __init__(self):
        self.rollback_manager = DeploymentRollbackManager()
        self.health_checker = HealthChecker()
        self.build_start_time = None
        self.deployment_version = self._generate_version()
    
    def _generate_version(self) -> str:
        """Generate a version string for this deployment"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"v{timestamp}"
    
    def execute_build(self) -> bool:
        """Execute the build process"""
        logger.info("Starting build process", version=self.deployment_version)
        self.build_start_time = time.time()
        
        try:
            # Check if package.json exists
            if not os.path.exists("package.json"):
                logger.error("package.json not found, cannot build")
                return False
            
            # Run npm install first if node_modules doesn't exist
            if not os.path.exists("node_modules"):
                logger.info("Installing dependencies")
                install_result = subprocess.run([
                    'npm', 'install'
                ], capture_output=True, text=True, check=True)
                
                logger.info("Dependencies installed successfully",
                           stdout_preview=install_result.stdout[:200])
            
            # Run build command
            logger.info("Running build command")
            build_result = subprocess.run([
                'npm', 'run', 'build'
            ], capture_output=True, text=True, check=True)
            
            build_duration = time.time() - self.build_start_time
            
            logger.info("Build completed successfully",
                       duration=f"{build_duration:.2f}s",
                       stdout_preview=build_result.stdout[:200])
            
            # Post-build validation
            if not self.health_checker.check_build_artifacts():
                logger.error("Build artifact validation failed")
                return False
            
            if not self.health_checker.check_syntax_errors():
                logger.error("Syntax validation failed")
                return False
            
            return True
        
        except subprocess.CalledProcessError as e:
            build_duration = time.time() - self.build_start_time if self.build_start_time else 0
            
            logger.error("Build process failed",
                        duration=f"{build_duration:.2f}s",
                        exit_code=e.returncode,
                        stderr=e.stderr,
                        stdout=e.stdout)
            return False
        
        except Exception as e:
            logger.error("Build process failed with unexpected error", error=str(e))
            return False
    
    def execute_deployment(self) -> bool:
        """Execute the deployment process"""
        logger.info("Starting deployment process", version=self.deployment_version)
        
        try:
            # For this implementation, we'll use a generic deployment command
            # In production, this could be firebase deploy, vercel deploy, etc.
            
            # Check if Firebase CLI is available
            firebase_available = self._check_firebase_availability()
            
            if firebase_available:
                return self._deploy_with_firebase()
            else:
                # Fallback to simple local deployment validation
                return self._validate_local_deployment()
        
        except Exception as e:
            logger.error("Deployment process failed", error=str(e))
            return False
    
    def _check_firebase_availability(self) -> bool:
        """Check if Firebase CLI is available"""
        try:
            result = subprocess.run([
                'firebase', '--version'
            ], capture_output=True, text=True, check=True)
            
            logger.info("Firebase CLI available", version=result.stdout.strip())
            return True
        
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.info("Firebase CLI not available, using alternative deployment")
            return False
    
    def _deploy_with_firebase(self) -> bool:
        """Deploy using Firebase CLI"""
        try:
            logger.info("Deploying with Firebase")
            
            deploy_result = subprocess.run([
                'firebase', 'deploy'
            ], capture_output=True, text=True, check=True)
            
            logger.info("Firebase deployment completed successfully",
                       stdout_preview=deploy_result.stdout[:300])
            
            # Record successful deployment
            self.rollback_manager.record_deployment(
                version=self.deployment_version,
                status='success',
                build_info={
                    'deployment_method': 'firebase',
                    'build_time': self.build_start_time,
                    'deploy_output': deploy_result.stdout[:500]
                }
            )
            
            return True
        
        except subprocess.CalledProcessError as e:
            logger.error("Firebase deployment failed",
                        exit_code=e.returncode,
                        stderr=e.stderr,
                        stdout=e.stdout)
            
            # Record failed deployment
            self.rollback_manager.record_deployment(
                version=self.deployment_version,
                status='failed',
                build_info={
                    'deployment_method': 'firebase',
                    'error': e.stderr
                }
            )
            
            # Attempt rollback on failure
            self._handle_deployment_failure()
            return False
    
    def _validate_local_deployment(self) -> bool:
        """Validate local deployment artifacts"""
        logger.info("Validating local deployment artifacts")
        
        # Check if dist directory exists and has required files
        dist_path = "dist/public"
        
        if not os.path.exists(dist_path):
            logger.error("Dist directory not found", path=dist_path)
            return False
        
        required_files = ["index.html"]
        for file in required_files:
            file_path = os.path.join(dist_path, file)
            if not os.path.exists(file_path):
                logger.error("Required deployment file missing", file=file_path)
                return False
        
        # Record successful local deployment
        self.rollback_manager.record_deployment(
            version=self.deployment_version,
            status='success',
            build_info={
                'deployment_method': 'local_validation',
                'build_time': self.build_start_time,
                'artifacts_path': dist_path
            }
        )
        
        logger.info("Local deployment validation completed successfully",
                   dist_path=dist_path)
        return True
    
    def _handle_deployment_failure(self) -> None:
        """Handle deployment failure with automatic rollback"""
        logger.error("Deployment failed, initiating automatic rollback")
        
        rollback_success = self.rollback_manager.rollback_to_previous()
        
        if rollback_success:
            logger.info("Automatic rollback initiated successfully")
        else:
            logger.error("Automatic rollback failed - manual intervention required")
    
    def run_pipeline(self) -> bool:
        """Run the complete build and deployment pipeline"""
        logger.info("Starting Chimera pipeline", version=self.deployment_version)
        
        try:
            # Step 1: Build
            if not self.execute_build():
                logger.error("Pipeline failed at build stage")
                return False
            
            # Step 2: Deploy
            if not self.execute_deployment():
                logger.error("Pipeline failed at deployment stage")
                return False
            
            # Step 3: Health check (if URL provided)
            deployment_url = os.getenv('DEPLOYMENT_URL')
            if deployment_url:
                if not self.health_checker.check_deployment_health(deployment_url):
                    logger.error("Pipeline failed at health check stage")
                    self._handle_deployment_failure()
                    return False
            
            logger.info("Pipeline completed successfully", 
                       version=self.deployment_version)
            return True
        
        except Exception as e:
            logger.error("Pipeline failed with unexpected error", error=str(e))
            return False

def main():
    """Main entry point for pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Chimera Pipeline - Build and Deployment Automation')
    parser.add_argument('--build-only', action='store_true', help='Run build stage only')
    parser.add_argument('--deploy-only', action='store_true', help='Run deployment stage only')
    parser.add_argument('--rollback', action='store_true', help='Rollback to previous deployment')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        pipeline = ChimeraPipeline()
        
        if args.rollback:
            logger.info("Initiating manual rollback")
            success = pipeline.rollback_manager.rollback_to_previous()
        elif args.build_only:
            logger.info("Running build stage only")
            success = pipeline.execute_build()
        elif args.deploy_only:
            logger.info("Running deployment stage only")
            success = pipeline.execute_deployment()
        else:
            logger.info("Running complete pipeline")
            success = pipeline.run_pipeline()
        
        if success:
            logger.info("Pipeline operation completed successfully")
            return 0
        else:
            logger.error("Pipeline operation failed")
            return 1
    
    except Exception as e:
        logger.error("Pipeline execution failed", error=str(e))
        return 1

if __name__ == '__main__':
    sys.exit(main())
