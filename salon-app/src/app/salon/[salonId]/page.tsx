import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import LoginView from '@/app/views/LoginView';

interface SalonPageProps {
  params: Promise<{ salonId: string }>;
}

export default async function SalonPage({ params }: SalonPageProps) {
  const { salonId } = await params;
  const supabase = await createClient();

  const { data: salon, error } = await supabase
    .from('salons')
    .select('id, name, address, phone, logo_url')
    .eq('id', salonId)
    .single();

  if (error || !salon) {
    notFound();
  }

  return (
    <LoginView
      salonId={salon.id}
      salonName={salon.name}
    />
  );
}
