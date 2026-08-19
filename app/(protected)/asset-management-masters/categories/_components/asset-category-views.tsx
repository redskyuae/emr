import { MoreVertical, Pencil, Tag, Trash2 } from 'lucide-react';

import type { AssetCategory } from '@/app/api/lib/modules/asset-category/schemas/asset-category-schema';
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

function CategoryColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="border-border inline-block size-4 rounded-sm border"
      style={{ backgroundColor: color }}
    />
  );
}

function CategoryIcon({ color }: { color: string }) {
  return (
    <div
      className="flex size-10 items-center justify-center rounded-full"
      style={{ backgroundColor: color + '22' }}
    >
      <Tag className="size-5" style={{ color }} />
    </div>
  );
}

function CategoryActionsMenu({
  category,
  onEdit,
  onDelete,
}: {
  category: AssetCategory;
  onEdit: (category: AssetCategory) => void;
  onDelete: (category: AssetCategory) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${category.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AssetCategoryTableView({
  categories,
  onEdit,
  onDelete,
}: {
  categories: AssetCategory[];
  onEdit: (category: AssetCategory) => void;
  onDelete: (category: AssetCategory) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="pl-4 font-medium">{category.name}</TableCell>
                  <TableCell className="font-mono text-xs">{category.code}</TableCell>
                  <TableCell>
                    <CategoryColorSwatch color={category.color} />
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {category.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <CategoryActionsMenu category={category} onEdit={onEdit} onDelete={onDelete} />
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

export function AssetCategoryCardView({
  categories,
  onEdit,
  onDelete,
}: {
  categories: AssetCategory[];
  onEdit: (category: AssetCategory) => void;
  onDelete: (category: AssetCategory) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <CategoryIcon color={category.color} />

            <div>
              <h3 className="font-heading text-base font-semibold">{category.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{category.code}</span>
              </p>
              <div className="mt-0.5">
                <CategoryColorSwatch color={category.color} />
              </div>
              {category.description ? (
                <p className="text-muted-foreground mt-0.5 max-w-xs truncate text-sm">
                  {category.description}
                </p>
              ) : null}
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(category)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(category)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AssetCategoryListView({
  categories,
  onEdit,
  onDelete,
}: {
  categories: AssetCategory[];
  onEdit: (category: AssetCategory) => void;
  onDelete: (category: AssetCategory) => void;
}) {
  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <Card key={category.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <CategoryIcon color={category.color} />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{category.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{category.code}</span>
              </div>
              <CategoryColorSwatch color={category.color} />
              {category.description ? (
                <div className="max-w-sm min-w-0 truncate">
                  <span className="text-muted-foreground">{category.description}</span>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <CategoryActionsMenu category={category} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
