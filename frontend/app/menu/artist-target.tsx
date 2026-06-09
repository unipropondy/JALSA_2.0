import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { Theme } from "@/constants/theme";
import { Fonts } from "@/constants/Fonts";
import { API_URL } from "@/constants/Config";
import { useAuthStore } from "@/stores/authStore";

interface ArtistRow {
  ArtistName: string;
  ActualSales: number;
  TargetAmount: number;
}

interface TargetModalProps {
  visible: boolean;
  artistName: string;
  currentTarget: number;
  onClose: () => void;
  onSave: (artistName: string, amount: number) => void;
}

const { width: SCREEN_W } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";

const fmt = (v: number) => `$${(v || 0).toFixed(2)}`;

const getStatus = (pct: number) => {
  if (pct >= 100) return { label: "Achieved", color: "#10b981", bg: "#d1fae5" };
  if (pct >= 75)  return { label: "On Track", color: "#3b82f6", bg: "#dbeafe" };
  if (pct >= 50)  return { label: "Progress", color: "#f59e0b", bg: "#fef3c7" };
  if (pct > 0)    return { label: "Behind",   color: "#ef4444", bg: "#fee2e2" };
  return                 { label: "No Target", color: "#94a3b8", bg: "#f1f5f9" };
};

// ── Date Picker Modal ────────────────────────────────────────────────────────
function DatePickerModal({ visible, title, selectedDate, onClose, onSelect }: any) {
  const [temp, setTemp] = useState<Date>(new Date(selectedDate));
  useEffect(() => { if (visible) setTemp(new Date(selectedDate)); }, [visible]);
  const change = (d: number) => { const n = new Date(temp); n.setDate(n.getDate() + d); setTemp(n); };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={dp.overlay}>
        <View style={dp.card}>
          <Text style={dp.title}>{title}</Text>
          <View style={dp.row}>
            <TouchableOpacity style={dp.arrow} onPress={() => change(-1)}>
              <Ionicons name="chevron-back" size={22} color={Theme.primary} />
            </TouchableOpacity>
            <Text style={dp.dateText}>{temp.toLocaleDateString("en-GB")}</Text>
            <TouchableOpacity style={dp.arrow} onPress={() => change(1)}>
              <Ionicons name="chevron-forward" size={22} color={Theme.primary} />
            </TouchableOpacity>
          </View>
          <View style={dp.actions}>
            <TouchableOpacity style={dp.cancelBtn} onPress={onClose}>
              <Text style={dp.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dp.applyBtn} onPress={() => { onSelect(temp); onClose(); }}>
              <Text style={dp.applyTxt}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Set Target Modal ─────────────────────────────────────────────────────────
function SetTargetModal({ visible, artistName, currentTarget, onClose, onSave }: TargetModalProps) {
  const [input, setInput] = useState(currentTarget > 0 ? currentTarget.toString() : "");
  useEffect(() => { if (visible) setInput(currentTarget > 0 ? currentTarget.toString() : ""); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={dp.overlay}>
        <View style={dp.card}>
          <Text style={dp.title}>Set Target</Text>
          <Text style={dp.subtitle}>{artistName}</Text>
          <View style={tm.inputRow}>
            <Text style={tm.dollar}>$</Text>
            <TextInput
              style={tm.input}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={Theme.textMuted}
              value={input}
              onChangeText={setInput}
              autoFocus
            />
          </View>
          <View style={dp.actions}>
            <TouchableOpacity style={dp.cancelBtn} onPress={onClose}>
              <Text style={dp.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dp.applyBtn}
              onPress={() => { onSave(artistName, parseFloat(input) || 0); onClose(); }}
            >
              <Text style={dp.applyTxt}>Save Target</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ArtistTarget() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [rows, setRows] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const today = new Date();
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  const [toDate, setToDate] = useState(today);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const [targetModal, setTargetModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistRow | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/settlement/artist-target-live`, {
        params: {
          fromDate: fromDate.toISOString().slice(0, 10),
          toDate: toDate.toISOString().slice(0, 10),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data.data || []);
    } catch (err: any) {
      console.error("Artist Target load error:", err);
      Alert.alert("Error", "Failed to load artist target data");
    } finally {
      setLoading(false);
    }
  }, [token, fromDate, toDate]);

  useEffect(() => { if (token) loadData(); }, [token, fromDate, toDate]);

  const handleSaveTarget = async (artistName: string, amount: number) => {
    try {
      setSavingTarget(true);
      // Find DishId from DishMaster via artist name (use artist-list endpoint)
      const listRes = await axios.get(`${API_URL}/api/settlement/artist-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const match = (listRes.data.data || []).find((d: any) =>
        (d.Name || "").toLowerCase() === artistName.toLowerCase()
      );
      if (!match) {
        Alert.alert("Artist not found", `${artistName} not found in DishMaster`);
        return;
      }
      await axios.post(`${API_URL}/api/settlement/artist-target`, {
        dishId: match.DishId,
        artistName,
        targetAmount: amount,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", "Failed to save target");
    } finally {
      setSavingTarget(false);
    }
  };

  const filtered = useMemo(() =>
    rows.filter(r => !search || r.ArtistName.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const summary = useMemo(() => {
    const totalArtists = rows.length;
    const totalTarget = rows.reduce((s, r) => s + (r.TargetAmount || 0), 0);
    const totalActual = rows.reduce((s, r) => s + (r.ActualSales || 0), 0);
    const pct = totalTarget > 0 ? Math.min(100, (totalActual / totalTarget) * 100) : 0;
    return { totalArtists, totalTarget, totalActual, pct };
  }, [rows]);

  const periodLabel = fromDate.toLocaleDateString("en-GB") === toDate.toLocaleDateString("en-GB")
    ? fromDate.toLocaleDateString("en-GB")
    : `${fromDate.toLocaleDateString("en-GB")} – ${toDate.toLocaleDateString("en-GB")}`;

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.headerTitle}>Artist Targets</Text>
            <Text style={s.headerSub}>Entertainment · {periodLabel}</Text>
          </View>
          <TouchableOpacity style={[s.iconBtn, { backgroundColor: Theme.primaryLight }]} onPress={loadData}>
            <Ionicons name="refresh" size={20} color={Theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* ── Date Filter ── */}
          <View style={s.dateRow}>
            <TouchableOpacity style={s.datePill} onPress={() => setShowFrom(true)}>
              <Ionicons name="calendar-outline" size={14} color={Theme.primary} />
              <Text style={s.datePillLabel}>FROM</Text>
              <Text style={s.datePillVal}>{fromDate.toLocaleDateString("en-GB")}</Text>
            </TouchableOpacity>
            <View style={s.dateSep} />
            <TouchableOpacity style={s.datePill} onPress={() => setShowTo(true)}>
              <Ionicons name="calendar-outline" size={14} color={Theme.primary} />
              <Text style={s.datePillLabel}>TO</Text>
              <Text style={s.datePillVal}>{toDate.toLocaleDateString("en-GB")}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Summary Cards ── */}
          {!loading && (
            <View style={s.cardsGrid}>
              <SummaryCard label="Total Artists" value={summary.totalArtists.toString()} icon="people" color="#3b82f6" />
              <SummaryCard label="Total Target" value={fmt(summary.totalTarget)} icon="flag" color="#f59e0b" />
              <SummaryCard label="Total Achieved" value={fmt(summary.totalActual)} icon="trending-up" color="#10b981" />
              <SummaryCard
                label="Achievement"
                value={`${summary.pct.toFixed(1)}%`}
                icon="trophy"
                color={summary.pct >= 100 ? "#10b981" : summary.pct >= 50 ? "#f59e0b" : "#ef4444"}
              />
            </View>
          )}

          {/* ── Overall Progress Bar ── */}
          {!loading && summary.totalTarget > 0 && (
            <View style={s.overallBar}>
              <View style={s.overallBarHeader}>
                <Text style={s.overallBarLabel}>Overall Completion</Text>
                <Text style={s.overallBarPct}>{summary.pct.toFixed(1)}%</Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${summary.pct}%` as any,
                  backgroundColor: summary.pct >= 100 ? "#10b981" : summary.pct >= 50 ? "#f59e0b" : "#ef4444"
                }]} />
              </View>
            </View>
          )}

          {/* ── Search ── */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={15} color={Theme.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search artists..."
              placeholderTextColor={Theme.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={15} color={Theme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Artist Cards ── */}
          {loading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Theme.primary} />
              <Text style={s.loadingTxt}>Loading Entertainment sales...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.center}>
              <Ionicons name="musical-notes-outline" size={48} color={Theme.textMuted} />
              <Text style={s.emptyTxt}>No Entertainment sales found</Text>
              <Text style={s.emptySubTxt}>for {periodLabel}</Text>
            </View>
          ) : (
            <View style={s.tableWrap}>
              {/* Table header */}
              <View style={s.tableHeader}>
                <Text style={[s.th, s.colArtist]}>Artist</Text>
                <Text style={[s.th, s.colNum]}>Achieved</Text>
                <Text style={[s.th, s.colNum]}>Target</Text>
                <Text style={[s.th, s.colNum]}>Balance</Text>
                <Text style={[s.th, s.colStatus]}>Status</Text>
              </View>

              {filtered.map((row, idx) => {
                const actual = row.ActualSales || 0;
                const target = row.TargetAmount || 0;
                const balance = target > 0 ? target - actual : 0;
                const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
                const status = getStatus(target > 0 ? pct : -1);

                return (
                  <TouchableOpacity
                    key={row.ArtistName}
                    activeOpacity={0.85}
                    style={[s.tableRow, idx % 2 === 1 && s.tableRowAlt]}
                    onPress={() => { setSelectedArtist(row); setTargetModal(true); }}
                  >
                    {/* Artist name + progress bar */}
                    <View style={s.colArtist}>
                      <Text style={s.artistName} numberOfLines={1}>{row.ArtistName}</Text>
                      {target > 0 && (
                        <View style={s.miniBarBg}>
                          <View style={[s.miniBarFill, {
                            width: `${pct}%` as any,
                            backgroundColor: status.color
                          }]} />
                        </View>
                      )}
                      {target > 0 && (
                        <Text style={[s.miniPct, { color: status.color }]}>{pct.toFixed(0)}%</Text>
                      )}
                    </View>

                    <Text style={[s.td, s.colNum, { color: "#10b981", fontFamily: Fonts.bold }]}>
                      {fmt(actual)}
                    </Text>
                    <Text style={[s.td, s.colNum, { color: target > 0 ? Theme.primary : Theme.textMuted }]}>
                      {target > 0 ? fmt(target) : "—"}
                    </Text>
                    <Text style={[s.td, s.colNum, {
                      color: balance > 0 ? "#ef4444" : balance < 0 ? "#10b981" : Theme.textMuted
                    }]}>
                      {target > 0 ? (balance > 0 ? `-${fmt(balance)}` : `+${fmt(Math.abs(balance))}`) : "—"}
                    </Text>

                    <View style={[s.colStatus, { alignItems: "center" }]}>
                      <View style={[s.badge, { backgroundColor: status.bg }]}>
                        <Text style={[s.badgeTxt, { color: status.color }]}>{status.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={Theme.textMuted} style={{ marginTop: 4 }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Modals ── */}
      <DatePickerModal visible={showFrom} title="From Date" selectedDate={fromDate}
        onClose={() => setShowFrom(false)} onSelect={setFromDate} />
      <DatePickerModal visible={showTo} title="To Date" selectedDate={toDate}
        onClose={() => setShowTo(false)} onSelect={setToDate} />
      <SetTargetModal
        visible={targetModal}
        artistName={selectedArtist?.ArtistName || ""}
        currentTarget={selectedArtist?.TargetAmount || 0}
        onClose={() => { setTargetModal(false); setSelectedArtist(null); }}
        onSave={handleSaveTarget}
      />

      {savingTarget && (
        <View style={s.savingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.savingTxt}>Saving target...</Text>
        </View>
      )}
    </View>
  );
}

// ── Summary Card Component ───────────────────────────────────────────────────
function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <View style={[sc.card, { borderTopColor: color }]}>
      <View style={[sc.iconBox, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={sc.val}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.bgMain },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Theme.border,
    backgroundColor: Theme.bgCard,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: Theme.bgInput,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: Fonts.black, fontSize: 17, color: Theme.textPrimary },
  headerSub:   { fontFamily: Fonts.medium, fontSize: 11, color: Theme.textSecondary, marginTop: 1 },

  dateRow: {
    flexDirection: "row", alignItems: "center", margin: 12,
    backgroundColor: Theme.bgCard, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Theme.border,
  },
  datePill: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, gap: 6 },
  datePillLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  datePillVal:   { fontFamily: Fonts.bold, fontSize: 13, color: Theme.textPrimary, flex: 1 },
  dateSep: { width: 1, height: 30, backgroundColor: Theme.border },

  cardsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 4 },

  overallBar: { marginHorizontal: 12, marginBottom: 12, backgroundColor: Theme.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Theme.border },
  overallBarHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  overallBarLabel: { fontFamily: Fonts.bold, fontSize: 12, color: Theme.textSecondary },
  overallBarPct:   { fontFamily: Fonts.black, fontSize: 12, color: Theme.textPrimary },
  progressBg: { height: 8, backgroundColor: Theme.bgInput, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: Theme.bgCard,
    marginHorizontal: 12, marginBottom: 12, borderRadius: 10, paddingHorizontal: 12,
    height: 42, borderWidth: 1, borderColor: Theme.border, gap: 8,
  },
  searchInput: {
    flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Theme.textPrimary,
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },

  tableWrap: { marginHorizontal: 12, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: Theme.border },
  tableHeader: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b",
    paddingVertical: 10, paddingHorizontal: 12,
  },
  th: { fontFamily: Fonts.bold, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },

  tableRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: Theme.bgCard, borderTopWidth: 1, borderTopColor: Theme.border,
  },
  tableRowAlt: { backgroundColor: Theme.bgMain },
  td: { fontFamily: Fonts.medium, fontSize: 12, color: Theme.textPrimary },

  colArtist: { flex: 1, paddingRight: 8 },
  colNum:    { width: 76, textAlign: "right" },
  colStatus: { width: 72 },

  artistName: { fontFamily: Fonts.bold, fontSize: 13, color: Theme.textPrimary, marginBottom: 4 },
  miniBarBg: { height: 4, backgroundColor: Theme.bgInput, borderRadius: 2, overflow: "hidden", marginBottom: 2 },
  miniBarFill: { height: "100%", borderRadius: 2 },
  miniPct: { fontFamily: Fonts.bold, fontSize: 9 },

  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  badgeTxt: { fontFamily: Fonts.bold, fontSize: 9 },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  loadingTxt: { fontFamily: Fonts.medium, fontSize: 13, color: Theme.textSecondary },
  emptyTxt: { fontFamily: Fonts.bold, fontSize: 15, color: Theme.textMuted, marginTop: 8 },
  emptySubTxt: { fontFamily: Fonts.medium, fontSize: 12, color: Theme.textMuted },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center", gap: 12,
  },
  savingTxt: { fontFamily: Fonts.bold, fontSize: 14, color: "#fff" },
});

const sc = StyleSheet.create({
  card: {
    width: (SCREEN_W - 36) / 2, backgroundColor: Theme.bgCard, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: Theme.border, borderTopWidth: 3,
    ...Platform.select({ web: { flex: 1 } as any }),
  },
  iconBox: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  val: { fontFamily: Fonts.black, fontSize: 18, color: Theme.textPrimary, marginBottom: 2 },
  label: { fontFamily: Fonts.medium, fontSize: 11, color: Theme.textSecondary },
});

const dp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  card: { width: "85%", maxWidth: 380, backgroundColor: Theme.bgCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Theme.border },
  title: { fontFamily: Fonts.black, fontSize: 16, color: Theme.textPrimary, marginBottom: 4 },
  subtitle: { fontFamily: Fonts.medium, fontSize: 12, color: Theme.textSecondary, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 20 },
  arrow: { width: 40, height: 40, borderRadius: 8, backgroundColor: Theme.bgInput, alignItems: "center", justifyContent: "center" },
  dateText: { fontFamily: Fonts.black, fontSize: 16, color: Theme.textPrimary },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 8, backgroundColor: Theme.bgInput, alignItems: "center", justifyContent: "center" },
  applyBtn:  { flex: 1, height: 44, borderRadius: 8, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center" },
  cancelTxt: { fontFamily: Fonts.bold, fontSize: 14, color: Theme.textSecondary },
  applyTxt:  { fontFamily: Fonts.bold, fontSize: 14, color: "#fff" },
});

const tm = StyleSheet.create({
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: Theme.primary, borderRadius: 10, paddingHorizontal: 12, height: 52, backgroundColor: Theme.bgInput, marginBottom: 20 },
  dollar: { fontFamily: Fonts.black, fontSize: 20, color: Theme.primary, marginRight: 6 },
  input: { flex: 1, fontFamily: Fonts.black, fontSize: 20, color: Theme.textPrimary, ...Platform.select({ web: { outlineStyle: "none" } as any }) },
});
