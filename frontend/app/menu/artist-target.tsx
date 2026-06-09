import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { Theme } from "@/constants/theme";
import { Fonts } from "@/constants/Fonts";
import { API_URL } from "@/constants/Config";
import { useAuthStore } from "@/stores/authStore";

interface DishOrderItemShareRecord {
  Id: string;
  CustomerName: string;
  Amount: number;
  FromDate: string | null;
  ToDate: string | null;
  TargetAmount: number;
  CreatedDate: string;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const formatAmount = (val: number) => {
  const n = Number(val) || 0;
  return `$${n.toFixed(2)}`;
};

export default function ArtistTarget() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [records, setRecords] = useState<DishOrderItemShareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/settlement/artist-target-records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data.data || []);
    } catch (err: any) {
      console.error("Error loading artist target records:", err);
      Alert.alert("Error", "Failed to load artist target records");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  const filtered = searchQuery
    ? records.filter((r) =>
        (r.CustomerName || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : records;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={20} color={Theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Artist Target Records</Text>
          <TouchableOpacity onPress={loadData} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color={Theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Sub-header info ── */}
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>
            Table: <Text style={styles.subHeaderBold}>dishOrderItemShare</Text>
          </Text>
          {!loading && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{records.length} rows</Text>
            </View>
          )}
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={16} color={Theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by name..."
            placeholderTextColor={Theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={Theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Table ── */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.primary} />
            <Text style={styles.loadingText}>Loading records...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-outline" size={48} color={Theme.textMuted} />
            <Text style={styles.emptyText}>No records found</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.scrollOuter}
          >
            <View>
              {/* Table Header */}
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.cellSN, styles.headerCell]}>S/N</Text>
                <Text style={[styles.cell, styles.cellName, styles.headerCell]}>CustomerName</Text>
                <Text style={[styles.cell, styles.cellAmount, styles.headerCell]}>Amount</Text>
                <Text style={[styles.cell, styles.cellDate, styles.headerCell]}>FromDate</Text>
                <Text style={[styles.cell, styles.cellDate, styles.headerCell]}>ToDate</Text>
                <Text style={[styles.cell, styles.cellAmount, styles.headerCell]}>TargetAmount</Text>
              </View>

              {/* Table Body */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                style={styles.scrollInner}
              >
                {filtered.map((rec, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <View
                      key={rec.Id}
                      style={[
                        styles.row,
                        isEven ? styles.rowEven : styles.rowOdd,
                      ]}
                    >
                      <Text style={[styles.cell, styles.cellSN, styles.bodyCell, styles.textMuted]}>
                        {idx + 1}
                      </Text>
                      <Text
                        style={[styles.cell, styles.cellName, styles.bodyCell, styles.textPrimary]}
                        numberOfLines={1}
                      >
                        {rec.CustomerName || "—"}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          styles.cellAmount,
                          styles.bodyCell,
                          styles.textRight,
                          { color: "#10b981" },
                        ]}
                      >
                        {formatAmount(rec.Amount)}
                      </Text>
                      <Text style={[styles.cell, styles.cellDate, styles.bodyCell, styles.textMuted]}>
                        {formatDate(rec.FromDate)}
                      </Text>
                      <Text style={[styles.cell, styles.cellDate, styles.bodyCell, styles.textMuted]}>
                        {formatDate(rec.ToDate)}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          styles.cellAmount,
                          styles.bodyCell,
                          styles.textRight,
                          { color: Theme.primary },
                        ]}
                      >
                        {formatAmount(rec.TargetAmount)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const COL_SN = 42;
const COL_NAME = 160;
const COL_AMOUNT = 100;
const COL_DATE = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.bgMain,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
    backgroundColor: Theme.bgCard,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Theme.bgInput,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: Fonts.black,
    fontSize: 17,
    color: Theme.textPrimary,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Theme.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  subHeaderText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Theme.textSecondary,
  },
  subHeaderBold: {
    fontFamily: Fonts.bold,
    color: Theme.primary,
  },
  badge: {
    backgroundColor: Theme.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Theme.primary,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.bgCard,
    margin: 12,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Theme.textPrimary,
    ...Platform.select({ web: { outlineStyle: "none" } as any }),
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  emptyText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Theme.textMuted,
    marginTop: 8,
  },
  scrollOuter: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.bgCard,
  },
  scrollInner: {
    maxHeight: 9999,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  headerRow: {
    backgroundColor: "#1e293b",
  },
  rowEven: {
    backgroundColor: Theme.bgCard,
  },
  rowOdd: {
    backgroundColor: Theme.bgMain,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cellSN: {
    width: COL_SN,
  },
  cellName: {
    width: COL_NAME,
    borderLeftWidth: 1,
    borderLeftColor: Theme.border,
  },
  cellAmount: {
    width: COL_AMOUNT,
    borderLeftWidth: 1,
    borderLeftColor: Theme.border,
  },
  cellDate: {
    width: COL_DATE,
    borderLeftWidth: 1,
    borderLeftColor: Theme.border,
  },
  headerCell: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyCell: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  textPrimary: {
    color: Theme.textPrimary,
  },
  textMuted: {
    color: Theme.textSecondary,
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
    fontFamily: Fonts.bold,
  },
});
