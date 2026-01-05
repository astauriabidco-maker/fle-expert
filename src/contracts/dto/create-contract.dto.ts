
export class CreateContractDto {
    startDate: string; // ISO Date string
    endDate?: string;
    hourlyRate: number;
    totalHours: number;
    formateurId: string;
    organizationId: string;
}
