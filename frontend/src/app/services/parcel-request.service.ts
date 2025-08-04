import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ParcelRequestData {
  receiverEmail: string;
  receiverName: string;
  receiverPhone?: string;
  description: string;
  weight: number;
  pickupLocation: string;
  destinationLocation: string;
  requestedPickupDate?: string;
  specialInstructions?: string;
}

export interface ParcelRequest extends ParcelRequestData {
  id: string;
  senderId: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ParcelRequestService {
  private readonly apiUrl = `${environment.apiUrl}/parcel-requests`;

  constructor(private http: HttpClient) {}

  /**
   * Submit a new parcel request
   */
  submitParcelRequest(data: ParcelRequestData): Observable<ParcelRequest> {
    return this.http.post<ParcelRequest>(this.apiUrl, data);
  }

  /**
   * Get all parcel requests (optionally paginated)
   */
  getParcelRequests(page: number = 1, limit: number = 10, filters?: any): Observable<{ requests: ParcelRequest[]; pagination: any }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '' && filters[key] !== 'ALL') {
          params = params.set(key, filters[key]);
        }
      });
    }
    // Now map to just the data property for compatibility with component
    return this.http.get<{ data: { requests: ParcelRequest[]; pagination: any } }>(this.apiUrl, { params })
      .pipe(
        map(res => res.data)
      );
  }

  /**
   * Get a single parcel request by ID
   */
  getParcelRequestById(id: string): Observable<ParcelRequest> {
    return this.http.get<ParcelRequest>(`${this.apiUrl}/${id}`);
  }

  /**
   * Delete a parcel request (by owner or admin)
   */
  deleteParcelRequest(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Admin: Approve a parcel request
   */
  approveParcelRequest(id: string): Observable<ParcelRequest> {
    return this.http.put<ParcelRequest>(`${this.apiUrl}/${id}/status`, { status: 'APPROVED' });
  }

  /**
   * Admin: Reject a parcel request
   */
  rejectParcelRequest(id: string, reason?: string): Observable<ParcelRequest> {
    return this.http.put<ParcelRequest>(`${this.apiUrl}/${id}/status`, { status: 'REJECTED', adminNotes: reason });
  }
}

