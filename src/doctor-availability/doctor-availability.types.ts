// Types related to doctor availability and scheduling slots
export interface Slot {
  start_time: string;
  end_time: string;
  capacity: number;
}
