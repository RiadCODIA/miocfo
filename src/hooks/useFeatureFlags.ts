import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  rolloutPercentage: number;
  conditions: Json;
  createdAt: string;
  updatedAt: string;
}

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(flag => ({
        id: flag.id,
        name: flag.name,
        description: flag.description,
        isEnabled: flag.is_enabled ?? false,
        rolloutPercentage: flag.rollout_percentage ?? 100,
        conditions: flag.conditions,
        createdAt: flag.created_at,
        updatedAt: flag.updated_at,
      })) as FeatureFlag[];
    },
  });
};

export const useCreateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { error } = await supabase
        .from('feature_flags')
        .insert({
          name: flag.name,
          description: flag.description,
          is_enabled: flag.isEnabled,
          rollout_percentage: flag.rolloutPercentage,
          conditions: flag.conditions,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag creato');
    },
    onError: (error) => {
      toast.error('Errore nella creazione del feature flag', {
        description: error.message,
      });
    },
  });
};

export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...flag }: Partial<FeatureFlag> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (flag.name !== undefined) updateData.name = flag.name;
      if (flag.description !== undefined) updateData.description = flag.description;
      if (flag.isEnabled !== undefined) updateData.is_enabled = flag.isEnabled;
      if (flag.rolloutPercentage !== undefined) updateData.rollout_percentage = flag.rolloutPercentage;
      if (flag.conditions !== undefined) updateData.conditions = flag.conditions;

      const { error } = await supabase
        .from('feature_flags')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag aggiornato');
    },
    onError: (error) => {
      toast.error('Errore nell\'aggiornamento del feature flag', {
        description: error.message,
      });
    },
  });
};

export const useDeleteFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag eliminato');
    },
    onError: (error) => {
      toast.error('Errore nell\'eliminazione del feature flag', {
        description: error.message,
      });
    },
  });
};
