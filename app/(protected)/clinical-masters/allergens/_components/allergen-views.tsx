import { MoreVertical, Pencil, ShieldAlert, Trash2 } from 'lucide-react';
import type {
  Allergen,
  AllergenCategory,
} from '@/app/api/lib/modules/allergen/schemas/allergen-schema';
import { Badge } from '@/components/ui/badge';
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

const CATEGORY_LABELS: Record<AllergenCategory, string> = {
  drug: 'Drug',
  food: 'Food',
  environmental: 'Environmental',
  other: 'Other',
};

function CategoryBadge({ category }: { category: AllergenCategory }) {
  return (
    <Badge variant="outline" className="capitalize">
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

function AllergenIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <ShieldAlert className="size-5" />
    </div>
  );
}

function AllergenActionsMenu({
  allergen,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  allergen: Allergen;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (allergen: Allergen) => void;
  onDelete: (allergen: Allergen) => void;
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
          aria-label={`Actions for ${allergen.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(allergen)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(allergen)}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AllergenTableView({
  allergens,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  allergens: Allergen[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (allergen: Allergen) => void;
  onDelete: (allergen: Allergen) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allergens.map((allergen) => (
                <TableRow key={allergen.id}>
                  <TableCell className="pl-4 font-medium">{allergen.name}</TableCell>
                  <TableCell className="font-mono text-xs">{allergen.code}</TableCell>
                  <TableCell>
                    <CategoryBadge category={allergen.category} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <AllergenActionsMenu
                      allergen={allergen}
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

export function AllergenCardView({
  allergens,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  allergens: Allergen[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (allergen: Allergen) => void;
  onDelete: (allergen: Allergen) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {allergens.map((allergen) => (
        <Card key={allergen.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <AllergenIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{allergen.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{allergen.code}</span>
              </p>
              <div className="mt-1.5">
                <CategoryBadge category={allergen.category} />
              </div>
            </div>

            {canEdit || canDelete ? (
              <div className="flex gap-2 border-t pt-3">
                {canEdit ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(allergen)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(allergen)}
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

export function AllergenListView({
  allergens,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  allergens: Allergen[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (allergen: Allergen) => void;
  onDelete: (allergen: Allergen) => void;
}) {
  return (
    <div className="space-y-3">
      {allergens.map((allergen) => (
        <Card key={allergen.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <AllergenIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{allergen.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{allergen.code}</span>
              </div>
              <div>
                <CategoryBadge category={allergen.category} />
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <AllergenActionsMenu
                allergen={allergen}
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
