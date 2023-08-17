# see https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-networking
# for details on the networking setup for Azure Postgres Flexible Server

resource "azurerm_virtual_network" "rides" {
  name                = var.app_name
  location            = azurerm_resource_group.rides.location
  resource_group_name = azurerm_resource_group.rides.name
  address_space       = ["10.1.0.0/16"]
}

resource "azurerm_subnet" "rides_db" {
  name                 = "${var.app_name}_db"
  resource_group_name  = azurerm_resource_group.rides.name
  virtual_network_name = azurerm_virtual_network.rides.name
  address_prefixes     = ["10.1.1.0/24"]
  service_endpoints    = ["Microsoft.Storage"]

  delegation {
    name = "fs"

    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"

      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_subnet" "rides_cluster" {
  name                 = "${var.app_name}_cluster"
  resource_group_name  = azurerm_resource_group.rides.name
  virtual_network_name = azurerm_virtual_network.rides.name
  address_prefixes     = ["10.1.2.0/24"]
}

resource "azurerm_private_dns_zone" "rides" {
  name                = "${var.app_name}-pdz.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.rides.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "rides" {
  name                  = "${var.app_name}-pdzvnetlink.com"
  private_dns_zone_name = azurerm_private_dns_zone.rides.name
  virtual_network_id    = azurerm_virtual_network.rides.id
  resource_group_name   = azurerm_resource_group.rides.name
}

output "rides_vnet_id" {
  description = "The ID of the vnet"
  value       = azurerm_virtual_network.rides.id
}

output "rides_db_subnet_id" {
  description = "The ID of the db subnet"
  value       = azurerm_subnet.rides_db.id
}

output "rides_cluster_subnet_id" {
  description = "The ID of the cluster subnet"
  value       = azurerm_subnet.rides_cluster.id
}
