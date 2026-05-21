export interface Member {
  id: number;
  member_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dob: string | null;
  gender: "male" | "female" | "other" | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  join_date: string | null;
  membership_type: "full" | "associate" | null;
  status: "active" | "inactive" | "visitor";
  photo_url: string | null;
  departments?: { id: number; name: string }[];
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
}

export interface PaginatedMembers {
  members: Member[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  visitors: number;
  new_this_month: number;
}

export interface SystemUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "data-entry" | "viewer";
  is_active: boolean;
  created_at: string;
}
