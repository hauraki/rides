# Sets global variables for this Terraform project.

variable "app_name" {
}

variable "registry_name" {}

variable "location" {
  default = "westeurope"
}

variable "kubernetes_version" {
  default = "1.27.3"
}
