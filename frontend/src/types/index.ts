export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'student';
  student_type?: 'school' | 'college';
  school_class?: string;
  college_name?: string;
  college_branch?: string;
  referral_code?: string;
  wallet_balance?: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface PricingConfig {
  id: number;
  category_key: string;
  category_name: string;
  student_type: string;
  base_price: number;
  unit_description: string;
  add_ons_json: string;
  is_active: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  student_id: number;
  student?: User;
  student_type: 'school' | 'college';
  category_key: string;
  project_title: string;
  description: string;
  ai_refined_scope?: string;
  domain: string;
  deliverables_json: string;
  page_count?: number;
  deadline: string;
  urgency: 'normal' | 'express' | 'super_express';
  base_price: number;
  addons_price: number;
  urgency_fee: number;
  total_price: number;
  advance_amount: number;
  balance_amount: number;
  status: 'pending_payment' | 'payment_submitted' | 'advance_paid' | 'in_progress' | 'ready_for_review' | 'completed' | 'cancelled' | 'revision_requested';
  advance_paid_at?: string;
  completed_at?: string;
  payment_method?: string;
  utr_number?: string;
  payment_verified?: boolean;
  coupon_code?: string;
  discount_amount?: number;
  admin_notes?: string;
  student_notes?: string;
  revision_count?: number;
  max_revisions?: number;
  revision_notes?: string;
  revision_requested_at?: string;
  plagiarism_score?: number;
  ai_detection_score?: number;
  plagiarism_report_url?: string;
  walkthrough_count?: number;
  walkthrough_scheduled_at?: string;
  walkthrough_meeting_url?: string;
  certificate_id?: string;
  certificate_issued_at?: string;
  github_repo_url?: string;
  deployed_url?: string;
  deployed_at?: string;
  group_members?: OrderGroupMember[];
  created_at: string;
  messages?: ChatMessage[];
  attachments?: OrderAttachment[];
}

export interface OrderGroupMember {
  id: number;
  order_id: number;
  name: string;
  email: string;
  phone?: string;
  role_in_team: string;
  share_amount: number;
  is_paid: boolean;
  paid_at?: string;
  utr_number?: string;
  qr_token?: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender?: User;
  order_id?: number;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'audio';
  file_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface OrderAttachment {
  id: number;
  order_id: number;
  file_name: string;
  file_url: string;
  file_type: 'reference' | 'deliverable' | 'preview';
  uploaded_by: 'admin' | 'student';
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  duration_hours: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface PriceBreakdown {
  base_price: number;
  addons_breakdown: Record<string, number>;
  urgency_fee: number;
  total: number;
  advance: number;
  balance: number;
}

export interface AiScope {
  refined_title: string;
  tech_stack: string[];
  deliverables_detail: string[];
  timeline_days: number;
  methodology: string;
  suggested_improvements: string[];
}

export interface AdminDashboard {
  total_orders: number;
  pending_payment_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  total_revenue: number;
  advance_collected: number;
  balance_pending: number;
  total_students: number;
  orders_today: number;
  revenue_this_month: number;
}
