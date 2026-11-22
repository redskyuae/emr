'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useRouter } from 'next/navigation';
import { CiBoxList, CiCircleAlert, CiGrid41, CiSearch, CiViewTable } from 'react-icons/ci';
import {
  PiCaretLeftLight,
  PiCaretRightLight,
  PiPlusLight,
  PiSparkleDuotone,
  PiMagnifyingGlassDuotone,
} from 'react-icons/pi';
import { toast } from 'sonner';
import type { TherapistSkill } from '@/app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useCreateTherapistSkill } from '@/app/queries/therapist-skills/useCreateTherapistSkill';
import { useTherapistSkillsQuery } from '@/app/queries/therapist-skills/useTherapistSkills';
import { useUpdateTherapistSkill } from '@/app/queries/therapist-skills/useUpdateTherapistSkill';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card>
          <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                <CiViewTable className="size-4" />
                Table
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <CiGrid41 className="size-4" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <CiBoxList className="size-4" />
                List
              </ToggleGroupItem>
            </ToggleGroup>

            <InputGroup className="lg:max-w-sm">
              <InputGroupAddon>
                <CiSearch className="size-4" />
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
                  <PiPlusLight className="size-4" />
                  Add Therapist Skill
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {skillsQuery.isError ? (
          <Alert variant="destructive">
            <CiCircleAlert className="size-4" />
            <AlertTitle>Could not load Therapist Skills</AlertTitle>
            <AlertDescription>{getApiErrorMessage(skillsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <SkeletonCrossfade
          isLoading={skillsQuery.isLoading}
          skeleton={<ViewSkeleton layout={viewLayout} canEdit={canUpdate} canDelete={canDelete} />}
        >
          {skills.length === 0 && !debouncedSearch ? (
            <EmptyState
              tone="amber"
              icon={PiSparkleDuotone}
              title="No Therapist Skills yet"
              className="bg-card min-h-80 border"
              description="Create Therapist Skills to qualify Therapists in this Tenant."
              actions={
                canCreate ? (
                  <Button type="button" onClick={openAddSheet}>
                    <PiPlusLight className="size-4" />
                    Add Therapist Skill
                  </Button>
                ) : null
              }
            />
          ) : skills.length === 0 && debouncedSearch ? (
            <EmptyState
              tone="neutral"
              icon={PiMagnifyingGlassDuotone}
              title="No results found"
              className="bg-card min-h-72 border"
              description={
                <>
                  No Therapist Skills match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                  term.
                </>
              }
            />
          ) : (
            <div className="space-y-4">
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
                      <PiCaretLeftLight className="size-4" />
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
                      <PiCaretRightLight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </SkeletonCrossfade>
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
