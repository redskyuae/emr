import { Plus } from 'lucide-react';

import {
  assets,
  type WorkOrderPriority,
  type WorkOrderStatus,
  type WorkOrderType,
} from '@/app/(protected)/assets-management/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

const typeOptions: { label: string; value: WorkOrderType }[] = [
  { label: 'Preventive', value: 'Preventive' },
  { label: 'Corrective', value: 'Corrective' },
  { label: 'Calibration', value: 'Calibration' },
  { label: 'Inspection', value: 'Inspection' },
];

const priorityOptions: { label: string; value: WorkOrderPriority }[] = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
  { label: 'Critical', value: 'Critical' },
];

const statusOptions: { label: string; value: WorkOrderStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Overdue', value: 'overdue' },
];

function formatAssetOption(asset: (typeof assets)[number]) {
  return `${asset.name} · ${asset.model}`;
}

export function NewWorkOrderSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" className="w-full sm:w-auto 2xl:ml-auto">
          <Plus className="size-4" />
          <span>New work order</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-[760px]"
        style={{ width: 'min(760px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
              <Plus className="size-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <SheetTitle className="truncate text-xl">New work order</SheetTitle>
              <SheetDescription>
                Raise preventive, corrective, calibration, or inspection work for an Asset.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <form className="space-y-5 p-4">
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Work Order details</h3>
                <p className="text-muted-foreground text-xs">
                  Identify the job and the Asset it belongs to.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="work-order-id">Work Order ID</Label>
                  <Input id="work-order-id" className="font-mono" placeholder="WO-1043" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-order-asset">Asset</Label>
                  <Select defaultValue={assets[0]?.id}>
                    <SelectTrigger id="work-order-asset" className="w-full">
                      <SelectValue placeholder="Select Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          <span className="font-mono text-xs">{asset.id}</span>
                          {formatAssetOption(asset)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-order-type">Type</Label>
                  <Select defaultValue="Preventive">
                    <SelectTrigger id="work-order-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-order-priority">Priority</Label>
                  <Select defaultValue="Medium">
                    <SelectTrigger id="work-order-priority" className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Assignment & schedule</h3>
                <p className="text-muted-foreground text-xs">
                  Assign ownership and planned dates for the work.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="work-order-technician">Technician</Label>
                  <Input id="work-order-technician" placeholder="Bilal Ahmed" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-order-status">Status</Label>
                  <Select defaultValue="open">
                    <SelectTrigger id="work-order-status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-order-created">Created</Label>
                  <Input id="work-order-created" placeholder="18 Jun 2026" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-order-due">Due</Label>
                  <Input id="work-order-due" placeholder="25 Jun 2026 or On hold" />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Scope</h3>
                <p className="text-muted-foreground text-xs">
                  Describe the maintenance request and clinical impact.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-order-note">Note</Label>
                <Textarea
                  id="work-order-note"
                  placeholder="Describe the fault, planned maintenance, calibration scope, or inspection checklist."
                />
              </div>
            </section>
          </form>
        </div>

        <SheetFooter className="bg-background flex-row justify-end border-t p-4">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button type="button">Save work order</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
