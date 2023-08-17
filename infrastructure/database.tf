variable "db_username" {
  description = "Database administrator username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}

resource "azurerm_postgresql_flexible_server" "rides" {
  name                   = "${var.app_name}-dbserver"
  resource_group_name    = azurerm_resource_group.rides.name
  location               = azurerm_resource_group.rides.location
  version                = "15"
  delegated_subnet_id    = azurerm_subnet.rides_db.id
  private_dns_zone_id    = azurerm_private_dns_zone.rides.id
  administrator_login    = var.db_username
  administrator_password = var.db_password
  storage_mb             = 32768
  sku_name               = "B_Standard_B1ms"
  backup_retention_days  = 7
  zone                   = "1"

  depends_on = [azurerm_private_dns_zone_virtual_network_link.rides]
}

resource "azurerm_postgresql_flexible_server_database" "rides" {
  name      = var.app_name
  server_id = azurerm_postgresql_flexible_server.rides.id
  collation = "en_US.UTF8"
  charset   = "UTF8"
}
