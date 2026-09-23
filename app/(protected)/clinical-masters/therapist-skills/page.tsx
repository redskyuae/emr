'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateTherapistSkill } from '@/app/queries/therapist-skills/useCreateTherapistSkill';
import { useTherapistSkillsQuery } from '@/app/queries/therapist-skills/useTherapistSkills';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function TherapistSkillsPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const skills = useTherapistSkillsQuery({ page: 1, limit: 999 });
  const create = useCreateTherapistSkill();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({ name, code: code || undefined });
      setName('');
      setCode('');
      toast.success('Therapist Skill created.');
    } catch {
      toast.error('Could not create Therapist Skill.');
    }
  }
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <p className="text-muted-foreground text-sm">Clinical Masters</p>
        <h1 className="text-2xl font-semibold tracking-tight">Therapist Skills</h1>
        <p className="text-muted-foreground">
          Manage Ayurvedic capabilities used for Therapist assignment.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add skill</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3" onSubmit={submit}>
            <Input
              className="max-w-xs"
              placeholder="Skill name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              className="max-w-xs"
              placeholder="Code (optional)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" disabled={create.isPending}>
              <Plus className="size-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          {skills.data?.data.map((skill) => (
            <div key={skill.id} className="rounded-md border p-3">
              <p className="font-medium">{skill.name}</p>
              <p className="text-muted-foreground text-sm">{skill.code ?? 'No code'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
