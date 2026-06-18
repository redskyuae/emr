import { Plus } from 'lucide-react';

import { assetCategories, type AssetStatus } from '@/app/(app)/assets/mock-data';
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
import { cn } from '@/lib/utils';

const statusOptions: { label: string; value: AssetStatus }[] = [
  { label: 'In Use', value: 'in-use' },
  { label: 'Available', value: 'available' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Retired', value: 'retired' },
];

export function AddAssetSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="size-4" />
          <span>Add asset</span>
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
              <SheetTitle className="truncate text-xl">Add asset</SheetTitle>
              <SheetDescription>
                Register tracked equipment for the active Facility.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <form className="space-y-5 p-4">
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Asset details</h3>
                <p className="text-muted-foreground text-xs">
                  Identity, category, and lifecycle state.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset-name">Asset name</Label>
                  <Input id="asset-name" placeholder="MRI Scanner 1.5T" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-id">Asset ID</Label>
                  <Input id="asset-id" className="font-mono" placeholder="IMG-RAD-03" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-category">Category</Label>
                  <Select defaultValue={assetCategories[0]?.id}>
                    <SelectTrigger id="asset-category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className={cn('size-2 rounded-full', category.color)} />
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-status">Status</Label>
                  <Select defaultValue="available">
                    <SelectTrigger id="asset-status" className="w-full">
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
                  <Label htmlFor="asset-manufacturer">Manufacturer</Label>
                  <Input id="asset-manufacturer" placeholder="Siemens Healthineers" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-model">Model</Label>
                  <Input id="asset-model" placeholder="Magnetom Sola" />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Assignment</h3>
                <p className="text-muted-foreground text-xs">
                  Where the Asset sits and who is accountable.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset-department">Department</Label>
                  <Input id="asset-department" placeholder="Radiology" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-custodian">Custodian</Label>
                  <Input id="asset-custodian" placeholder="Dr. Omar Yusuf" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="asset-location">Location</Label>
                  <Input id="asset-location" placeholder="Block A · Radiology R-12" />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Service & value</h3>
                <p className="text-muted-foreground text-xs">Maintenance dates and book value.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="asset-next-service">Next service</Label>
                  <Input id="asset-next-service" placeholder="02 Jul 2026" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-value">Value</Label>
                  <Input id="asset-value" inputMode="numeric" placeholder="5740000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-serial">Serial</Label>
                  <Input id="asset-serial" className="font-mono" placeholder="SN-MG-88421" />
                </div>
                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="asset-notes">Notes</Label>
                  <Textarea
                    id="asset-notes"
                    placeholder="Warranty, calibration, or onboarding notes"
                  />
                </div>
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
            <Button type="button">Save asset</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
