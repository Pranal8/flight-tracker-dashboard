import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Flight {
  flightNumber: string;
  callsign: string;
  aircraftType: string;
  origin: string;
  destination: string;
  currentCoordinates: [number, number];
  originCoordinates: [number, number];
  destinationCoordinates: [number, number];
  status: 'Active' | 'Delayed' | 'Arrived';
  departureTime: string;
  arrivalTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private flightsUrl = 'assets/flights-mock.json';
  
  private allFlightsSubject = new BehaviorSubject<Flight[]>([]);
  private selectedFlightSubject = new BehaviorSubject<Flight | null>(null);
  
  private filtersSubject = new BehaviorSubject<{search: string, status: string, origin: string, destination: string}>({
    search: '', status: '', origin: '', destination: ''
  });

  allFlights$ = this.allFlightsSubject.asObservable();
  selectedFlight$ = this.selectedFlightSubject.asObservable();
  filters$ = this.filtersSubject.asObservable();

  filteredFlights$ = combineLatest([this.allFlights$, this.filters$]).pipe(
    map(([flights, filters]) => {
      return flights.filter(flight => {
        const matchesSearch = flight.callsign.toLowerCase().includes(filters.search.toLowerCase()) || 
                              flight.flightNumber.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus = filters.status ? flight.status === filters.status : true;
        const matchesOrigin = filters.origin ? flight.origin === filters.origin : true;
        const matchesDest = filters.destination ? flight.destination === filters.destination : true;
        return matchesSearch && matchesStatus && matchesOrigin && matchesDest;
      });
    })
  );

  kpiStats$ = this.allFlights$.pipe(
    map(flights => ({
      total: flights.length,
      active: flights.filter(f => f.status === 'Active').length,
      delayed: flights.filter(f => f.status === 'Delayed').length,
      arrived: flights.filter(f => f.status === 'Arrived').length
    }))
  );

  constructor(private http: HttpClient) {
    this.loadInitialFlights();
  }

  private loadInitialFlights() {
    this.http.get<Flight[]>(this.flightsUrl).subscribe(data => this.allFlightsSubject.next(data));
  }

  updateFilters(filters: any) {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  selectFlight(flight: Flight | null) {
    this.selectedFlightSubject.next(flight);
  }
}