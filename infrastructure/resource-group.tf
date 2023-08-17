resource "azurerm_resource_group" "rides" {
  name     = var.app_name
  location = var.location
}

output "rides_rg_id" {
  description = "The ID of the resource group"
  value       = azurerm_resource_group.rides.id
}

output "rides_rg_name" {
  description = "The ID of the resource group"
  value       = azurerm_resource_group.rides.name
}
