terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

module "cloudflare-pages-dapp" {
  source  = "app.terraform.io/mantrachain/pages-dapp/cloudflare"
  version = "1.0.0"
  
  cloudflare_account_id = "2ff8e4962cfd414617e13d4c503e09ae"
  project_name          = "mantra-dapp-dapp-template"
  repo_owner            = "MANTRA-Chain"
  repo_name             = "dapp-template"
  domains               = []
  cloudflare_zta_additional_domains = []
  
  # Will watch all the path inside the webapp folder
  path_includes = ["*"] 
  
  # Exclude README.md from deployment
  path_excludes = ["README.md"]

  # Node.js configuration
  nodejs_version          = "22.16.0"
  package_manager_name    = "yarn"
  package_manager_version = "1.22.22"

  # Environment variables configuration
  preview_environment_variables = {
    "EXAMPLE" = "PREVIEW"
  }
  
  production_environment_variables = {
    "EXAMPLE" = "PRODUCTION"
  }
}
