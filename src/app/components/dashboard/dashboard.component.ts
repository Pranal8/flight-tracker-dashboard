import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FlightService } from '../../services/flight.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  isDropdownOpen = false;
  selectedStatusLabel = 'All Statuses';

  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;

  constructor(public flightService: FlightService) {}

  toggleDropdown(event: Event) {
    event.stopPropagation(); 
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectStatus(statusValue: string, label: string) {
    this.selectedStatusLabel = label;
    this.isDropdownOpen = false;
    this.flightService.updateFilters({ status: statusValue });
  }

  @HostListener('document:pointerdown', ['$event'])
  onGlobalClick(event: MouseEvent): void {
    if (this.isDropdownOpen && this.dropdownContainer) {
      const clickedInside = this.dropdownContainer.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.isDropdownOpen = false;
      }
    }
  }

  onSearchChange(event: any) {
    this.flightService.updateFilters({ search: event.target.value });
  }

  clearSelection() {
    this.flightService.selectFlight(null);
  }
}