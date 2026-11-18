'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TherapistSkill } from '@/app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useCreateTherapistSkill } from '@/app/queries/therapist-skills/useCreateTherapistSkill';
import { useTherapistSkillsQuery } from '@/app/queries/therapist-skills/useTherapistSkills';
import { useUpdateTherapistSkill } from '@/app/queries/therapist-skills/useUpdateTherapistSkill';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  therapistSkillFormSchema,
  type TherapistSkillFormValues,
} from '../_utils/therapist-skill-form-schema';
import { DeleteTherapistSkillDialog } from './_modals/delete-therapist-skill-dialog';
import { TherapistSkillFormSheet } from './_sheets/therapist-skills-form-sheet';
import { ViewSkeleton } from './therapist-skill-skeletons';
import {
  TherapistSkillCardView,
  TherapistSkillListView,
  TherapistSkillTableView,
} from './therapist-skill-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;
const EMPTY_VALUES: TherapistSkillFormValues = { name: '', code: '' };

export function TherapistSkillsPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<TherapistSkill | null>(null);
  const [skillPendingDelete, setSkillPendingDelete] = useState<TherapistSkill | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<TherapistSkillFormValues>({
    resolver: zodResolver(therapistSkillFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_VALUES,
  });

  const skillsQuery = useTherapistSkillsQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateTherapistSkill();
  const updateMutation = useUpdateTherapistSkill();

  const { data: canCreate } = useHasPermission('therapist-skill:create');
  const { data: canUpdate } = useHasPermission('therapist-skill:update');
  const { data: canDelete } = useHasPermission('therapist-skill:delete');

  const skills = skillsQuery.data?.data ?? [];
  const meta = skillsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingSkill;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!initialCreateOpen || initialCreateHandledRef.current || !canCreate) {
      return;
    }

    initialCreateHandledRef.current = true;
    openAddSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCreateOpen, canCreate]);

  const previousDebouncedRef = useRef(debouncedSearch);
  if (previousDebouncedRef.current !== debouncedSearch) {
    previousDebouncedRef.current = debouncedSearch;
    if (page !== 1) {
      setPage(1);
    }
  }

  function openAddSheet() {
    setEditingSkill(null);
    form.reset(EMPTY_VALUES);
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(skill: TherapistSkill) {
    setEditingSkill(skill);
    form.reset({ name: skill.name, code: skill.code ?? '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingSkill(null);
    form.reset(EMPTY_VALUES);
    setServerErrors([]);
    router.replace('/clinical-masters/therapist-skills', { scroll: false });
  }

  const handleSave = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({ name: values.name, code: values.code });
        toast.success('Therapist Skill created.');
      } else {
        await updateMutation.mutateAsync({
          id: editingSkill.id,
          request: {
            name: values.name,
            code: values.code,
            description: editingSkill.description,
          },
        });
        toast.success('Therapist Skill updated.');
      }
      closeSheet();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  function handleSkillDeleted(skillId: number) {
    if (editingSkill?.id === skillId) {
      closeSheet();
    }
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <ToggleGroup
              type="single"
              value={viewLayout}
              onValueChange={(value) => {
                if (value) setViewLayout(value as ViewLayout);
              }}
              variant="outline"
              size="lg"
              spacing={0}
            >
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon className="size-4" />
                Table
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="size-4" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <LayoutList className="size-4" />
                List
              </ToggleGroupItem>
            </ToggleGroup>

            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search therapist skills..."
                aria-label="Search therapist skills"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={openAddSheet}>
                  <Plus className="size-4" />
                  Add Therapist Skill
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {skillsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Therapist Skills</AlertTitle>
            <AlertDescription>{getApiErrorMessage(skillsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {skillsQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : skills.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyTitle>No Therapist Skills yet</EmptyTitle>
              <EmptyDescription>
                Create Therapist Skills to qualify Therapists in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={openAddSheet}>
                  <Plus className="size-4" />
                  Add Therapist Skill
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : skills.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Therapist Skills match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <TherapistSkillTableView
                skills={skills}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setSkillPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <TherapistSkillCardView
                skills={skills}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setSkillPendingDelete}
              />
            ) : (
              <TherapistSkillListView
                skills={skills}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setSkillPendingDelete}
              />
            )}

            {totalPages > 0 ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-muted-foreground text-sm">
                  Showing {rangeStart}&ndash;{rangeEnd} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <TherapistSkillFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingSkill?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <DeleteTherapistSkillDialog
        skill={skillPendingDelete}
        onClose={() => setSkillPendingDelete(null)}
        onDeleted={handleSkillDeleted}
      />
    </>
  );
}
