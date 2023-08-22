package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	db "app.hauraki.de/rides/db"
)

type Driver struct {
	Id           *string `json:"id"`
	Name         *string `json:"name"`
	Status       *string `json:"status"`
	Location     *string `json:"location"`
	Path         *string `json:"path"`
	PathIndex    *int    `json:"path_index"`
	PathLength   *int    `json:"path_length"`
	PathDigest   *string `json:"path_digest"`
	CustomerId   *string `json:"customer_id"`
	CustomerName *string `json:"customer_name"`
}

type Customer struct {
	Id          *string `json:"id"`
	Name        *string `json:"name"`
	Active      *bool   `json:"active"`
	Location    *string `json:"location"`
	Destination *string `json:"destination"`
	DriverId    *string `json:"driver_id"`
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func getDrivers(w http.ResponseWriter, req *http.Request) {
	enableCors(&w)
	rows, err := db.Connection.Query("SELECT * FROM drivers")
	if err != nil {
		http.Error(w, "Failed to get drivers: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	drivers := []Driver{}

	for rows.Next() {
		var driver Driver
		rows.Scan(&driver.Id, &driver.Name, &driver.Status, &driver.Location, &driver.Path, &driver.PathIndex, &driver.CustomerId, &driver.CustomerName, &driver.PathLength, &driver.PathDigest)
		drivers = append(drivers, driver)
	}

	driversBytes, _ := json.MarshalIndent(drivers, "", "\t")

	w.Header().Set("Content-Type", "application/json")
	w.Write(driversBytes)
}

func getCustomers(w http.ResponseWriter, req *http.Request) {
	enableCors(&w)
	rows, err := db.Connection.Query("SELECT * FROM customers WHERE active = true")
	if err != nil {
		http.Error(w, "Failed to get customers: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	customers := []Customer{}

	for rows.Next() {
		var customer Customer
		rows.Scan(&customer.Id, &customer.Name, &customer.Active, &customer.Location, &customer.Destination, &customer.DriverId)
		customers = append(customers, customer)
	}

	customersBytes, _ := json.MarshalIndent(customers, "", "\t")

	w.Header().Set("Content-Type", "application/json")
	w.Write(customersBytes)
}

func getVersion(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "version endpoint for testing")
}

func main() {
	db.InitDB()
	defer db.Connection.Close()

	http.HandleFunc("/customers", getCustomers)
	http.HandleFunc("/drivers", getDrivers)
	http.HandleFunc("/version", getVersion)

	log.Println("Listening on port 8080")
	http.ListenAndServe(":8080", nil)
}
