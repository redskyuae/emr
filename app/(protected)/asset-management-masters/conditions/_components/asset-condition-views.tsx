import { Gauge, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { AssetCondition } from '@/app/api/lib/modules/asset-condition/schemas/asset-condition-schema';
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

function ConditionColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="border-border inline-block size-4 rounded-sm border"
      style={{ backgroundColor: color }}
    />
  );
}

function ConditionIcon({ color }: { color: string }) {
  return (
    <div
      className="flex size-10 items-center justify-center rounded-full"
      style={{ backgroundColor: color + '22' }}
    >
      <Gauge className="size-5" style={{ color }} />
    </div>
  );
}

function ConditionActionsMenu({
  condition,
  onEdit,
  onDelete,
}: {
  condition: AssetCondition;
  onEdit: (condition: AssetCondition) => void;
  onDelete: (condition: AssetCondition) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${condition.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(condition)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(condition)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AssetConditionTableView({
  conditions,
  onEdit,
  onDelete,
}: {
  conditions: AssetCondition[];
  onEdit: (condition: AssetCondition) => void;
  onDelete: (condition: AssetCondition) => void;
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
              {conditions.map((condition) => (
                <TableRow key={condition.id}>
                  <TableCell className="pl-4 font-medium">{condition.name}</TableCell>
                  <TableCell className="font-mono text-xs">{condition.code}</TableCell>
                  <TableCell>
                    <ConditionColorSwatch color={condition.color} />
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {condition.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ConditionActionsMenu
                      condition={condition}
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

export function AssetConditionCardView({
  conditions,
  onEdit,
  onDelete,
}: {
  conditions: AssetCondition[];
  onEdit: (condition: AssetCondition) => void;
  onDelete: (condition: AssetCondition) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {conditions.map((condition) => (
        <Card key={condition.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <ConditionIcon color={condition.color} />

            <div>
              <h3 className="font-heading text-base font-semibold">{condition.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{condition.code}</span>
              </p>
              <div className="mt-0.5">
                <ConditionColorSwatch color={condition.color} />
              </div>
              {condition.description ? (
                <p className="text-muted-foreground mt-0.5 text-sm">{condition.description}</p>
              ) : null}
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(condition)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(condition)}
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

export function AssetConditionListView({
  conditions,
  onEdit,
  onDelete,
}: {
  conditions: AssetCondition[];
  onEdit: (condition: AssetCondition) => void;
  onDelete: (condition: AssetCondition) => void;
}) {
  return (
    <div className="space-y-3">
      {conditions.map((condition) => (
        <Card key={condition.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <ConditionIcon color={condition.color} />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{condition.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-14 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{condition.code}</span>
              </div>
              <ConditionColorSwatch color={condition.color} />
              {condition.description ? (
                <div className="min-w-0">
                  <span className="text-muted-foreground truncate">{condition.description}</span>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 pl-14 sm:pl-0">
              <ConditionActionsMenu condition={condition} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
