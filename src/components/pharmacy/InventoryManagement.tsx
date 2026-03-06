import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Search, Package, AlertTriangle, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "./types";

const CATEGORIES = ["General", "Antibiotic", "Painkiller", "Antacid", "Vitamin", "Ointment", "Syrup", "Injection", "Other"];
const UNITS = ["tablets", "capsules", "bottles", "tubes", "vials", "strips", "sachets"];

export function InventoryManagement() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({
    medicine_name: "",
    generic_name: "",
    category: "General",
    quantity: 0,
    unit: "tablets",
    reorder_level: 10,
    expiry_date: "",
    batch_number: "",
    supplier: "",
    notes: "",
  });

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pharmacy_inventory")
      .select("*")
      .order("medicine_name", { ascending: true });

    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setInventory((data as InventoryItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const resetForm = () => {
    setForm({ medicine_name: "", generic_name: "", category: "General", quantity: 0, unit: "tablets", reorder_level: 10, expiry_date: "", batch_number: "", supplier: "", notes: "" });
    setEditingItem(null);
  };

  const openAddDialog = () => { resetForm(); setDialogOpen(true); };
  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      medicine_name: item.medicine_name,
      generic_name: item.generic_name || "",
      category: item.category || "General",
      quantity: item.quantity,
      unit: item.unit,
      reorder_level: item.reorder_level || 10,
      expiry_date: item.expiry_date || "",
      batch_number: item.batch_number || "",
      supplier: item.supplier || "",
      notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.medicine_name.trim()) {
      toast({ title: "Error", description: "Medicine name is required", variant: "destructive" });
      return;
    }

    const payload = {
      medicine_name: form.medicine_name.trim(),
      generic_name: form.generic_name.trim() || null,
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      reorder_level: form.reorder_level,
      expiry_date: form.expiry_date || null,
      batch_number: form.batch_number.trim() || null,
      supplier: form.supplier.trim() || null,
      notes: form.notes.trim() || null,
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase.from("pharmacy_inventory").update(payload).eq("id", editingItem.id));
    } else {
      ({ error } = await supabase.from("pharmacy_inventory").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingItem ? "Medicine Updated" : "Medicine Added", description: `${form.medicine_name} has been ${editingItem ? "updated" : "added"} successfully.` });
      setDialogOpen(false);
      resetForm();
      fetchInventory();
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    const { error } = await supabase.from("pharmacy_inventory").delete().eq("id", item.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${item.medicine_name} removed from inventory.` });
      fetchInventory();
    }
  };

  const filtered = inventory.filter(i => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.medicine_name.toLowerCase().includes(q) || (i.generic_name?.toLowerCase().includes(q)) || i.category.toLowerCase().includes(q);
  });

  const lowStockCount = inventory.filter(i => i.quantity <= (i.reorder_level || 10)).length;
  const totalMedicines = inventory.length;
  const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalMedicines}</p>
            <p className="text-sm text-muted-foreground">Total Medicines</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalStock}</p>
            <p className="text-sm text-muted-foreground">Total Stock</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{lowStockCount}</p>
            <p className="text-sm text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-1" /> Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Medicine Name *</Label>
                <Input value={form.medicine_name} onChange={(e) => setForm(f => ({ ...f, medicine_name: e.target.value }))} />
              </div>
              <div>
                <Label>Generic Name</Label>
                <Input value={form.generic_name} onChange={(e) => setForm(f => ({ ...f, generic_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm(f => ({ ...f, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" min={0} value={form.reorder_level} onChange={(e) => setForm(f => ({ ...f, reorder_level: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Batch Number</Label>
                  <Input value={form.batch_number} onChange={(e) => setForm(f => ({ ...f, batch_number: e.target.value }))} />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input value={form.supplier} onChange={(e) => setForm(f => ({ ...f, supplier: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave}>{editingItem ? "Update" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medicine List */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading inventory...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No medicines found. Click "Add Medicine" to start.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <Card key={item.id} className={`hover:shadow-md transition-shadow ${item.quantity <= (item.reorder_level || 10) ? "border-orange-300 bg-orange-50/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.medicine_name}</span>
                      {item.generic_name && <span className="text-sm text-muted-foreground">({item.generic_name})</span>}
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      {item.quantity <= (item.reorder_level || 10) && (
                        <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                      <span>Stock: <strong className="text-foreground">{item.quantity} {item.unit}</strong></span>
                      {item.batch_number && <span>Batch: {item.batch_number}</span>}
                      {item.expiry_date && <span>Exp: {item.expiry_date}</span>}
                      {item.supplier && <span>Supplier: {item.supplier}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
