import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { FlightService, Flight } from '../../services/flight.service';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private routePolyline: L.Polyline | null = null;
  private sub = new Subscription();

  private pulseIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="6" fill="#00f2fe" />
      <circle cx="16" cy="16" r="12" fill="none" stroke="#00f2fe" stroke-width="2" opacity="0.4">
        <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;

  constructor(private flightService: FlightService) {}

  ngAfterViewInit() {
    this.initMap();
    
    this.sub.add(
      this.flightService.filteredFlights$.subscribe(flights => {
        this.updateMarkers(flights);
      })
    );

    // Listen to selected flight changes to draw paths and re-center map
    this.sub.add(
      this.flightService.selectedFlight$.subscribe(flight => {
        this.handleFlightSelection(flight);
      })
    );
  }

  private initMap() {
    this.map = L.map('map', { zoomControl: false }).setView([20.5937, 78.9629], 5); 
    
    // Position the zoom controls on the bottom-right out of the sidebar's way
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
  }

  private updateMarkers(flights: Flight[]) {
    this.markersLayer.clearLayers();
    
    flights.forEach(flight => {
      const dynamicIcon = L.divIcon({
        html: this.pulseIconSvg,
        className: 'radar-custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(flight.currentCoordinates, { icon: dynamicIcon });

      marker.bindPopup(`
        <div style="padding: 4px;">
          <b style="color: #00f2fe; font-size: 1rem;">${flight.flightNumber}</b><br>
          <span style="color: #64748b; font-size: 0.75rem; font-weight: bold;">CALLSIGN:</span> ${flight.callsign}<br>
          <span style="color: #64748b; font-size: 0.75rem; font-weight: bold;">ROUTE:</span> ${flight.origin} ➔ ${flight.destination}<br>
          <span style="color: #64748b; font-size: 0.75rem; font-weight: bold;">STATUS:</span> <span style="color: ${flight.status === 'Delayed' ? '#ff9100' : '#00e676'}">${flight.status}</span>
        </div>
      `);

      marker.on('click', () => {
        this.flightService.selectFlight(flight);
      });

      this.markersLayer.addLayer(marker);
    });
  }

  private handleFlightSelection(flight: Flight | null) {
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }

    if (!flight) return;

    const pathCoords = [flight.originCoordinates, flight.destinationCoordinates];
    this.routePolyline = L.polyline(pathCoords, { 
      color: '#00f2fe', 
      weight: 3, 
      dashArray: '6, 10',
      opacity: 0.9
    }).addTo(this.map);

    this.map.flyTo(flight.currentCoordinates, 6, {
      animate: true,
      duration: 1.5
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}