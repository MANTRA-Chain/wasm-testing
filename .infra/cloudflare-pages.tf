# terraform {
#   required_providers {
#     cloudflare = {
#       source  = "cloudflare/cloudflare"
#       version = "~> 5.0"
#     }
#   }
# }

# module "cloudflare-pages-dapp" {
#   source  = "app.terraform.io/mantrachain/pages-dapp/cloudflare"
#   version = "1.0.0"
  
#   cloudflare_account_id = "c1b181c9711b19ce0ed8b289c6995f7c"
#   project_name          = "mantra-dapp-dapp-template-devsecops"
#   repo_owner            = "MANTRA-Chain"
#   repo_name             = "dapp-template-devsecops"
#   domains               = []
#   cloudflare_zta_additional_domains = []

#   # Node.js configuration
#   nodejs_version          = "22.16.0"
#   package_manager_name    = "yarn"
#   package_manager_version = "1.22.22"

#   # Environment variables configuration
#   preview_environment_variables = {
#     "EXAMPLE" = "PREVIEW"
#   }
  
#   production_environment_variables = {
#     "EXAMPLE" = "PRODUCTION"
#   }
# }
