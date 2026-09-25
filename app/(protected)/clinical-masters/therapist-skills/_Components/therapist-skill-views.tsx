import { MoreVertical, Pencil, Sparkles, Trash2 } from 'lucide-react';
import type { TherapistSkill } from '@/app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type TherapistSkillViewProps = {
  skills: TherapistSkill[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (skill: TherapistSkill) => void;
  onDelete: (skill: TherapistSkill) => void;
};

function SkillIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Sparkles className="size-5" />
    </div>
  );
}

function SkillActionsMenu({
  skill,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  skill: TherapistSkill;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (skill: TherapistSkill) => void;
  onDelete: (skill: TherapistSkill) => void;
}) {
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${skill.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(skill)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(skill)}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TherapistSkillTableView({
  skills,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: TherapistSkillViewProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Skill Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="pl-4 font-medium">{skill.name}</TableCell>
                  <TableCell className="font-mono text-xs">{skill.code || '—'}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <SkillActionsMenu
                      skill={skill}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function TherapistSkillCardView({
  skills,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: TherapistSkillViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <Card key={skill.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <SkillIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{skill.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{skill.code || '—'}</span>
              </p>
            </div>

            {canEdit || canDelete ? (
              <div className="flex gap-2 border-t pt-3">
                {canEdit ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(skill)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(skill)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TherapistSkillListView({
  skills,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: TherapistSkillViewProps) {
  return (
    <div className="space-y-3">
      {skills.map((skill) => (
        <Card key={skill.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <SkillIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{skill.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{skill.code || '—'}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <SkillActionsMenu
                skill={skill}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
