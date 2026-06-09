import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme } from "@/constants/theme";
import { Fonts } from "@/constants/Fonts";
import { API_URL } from "@/constants/Config";
import { useAuthStore } from "@/stores/authStore";

export default function ArtistTarget() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<any[]>([]);
  const [actualSales, setActualSales] = useState<Record<string, number>>({});
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Date states
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  
  // Date Picker Modals
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Edit Target Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [targetInput, setTargetInput] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      
      const salesRes = await axios.get(`${API_URL}/api/settlement/artist-sales`, {
        params: {
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const list = salesRes.data.data || [];
      setArtists(list);
      
      const salesMap: Record<string, number> = {};
      const targetsMap: Record<string, number> = {};
      list.forEach((row: any) => {
        salesMap[row.Name] = row.ActualSales || 0;
        targetsMap[row.Name] = row.TargetAmount || 0;
      });
      setActualSales(salesMap);
      setTargets(targetsMap);
    } catch (err) {
      console.error("Error loading Artist Target data:", err);
      Alert.alert("Error", "Failed to load artist target data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, fromDate, toDate]);

  const handleSaveTarget = async () => {
    if (!selectedArtist) return;
    const value = parseFloat(targetInput) || 0;
    if (value < 0) {
      Alert.alert("Invalid Input", "Target must be a positive number");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/settlement/artist-target`, {
        dishId: selectedArtist.DishId,
        artistName: selectedArtist.Name,
        targetAmount: value,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setShowEditModal(false);
      setSelectedArtist(null);
      setTargetInput("");
      await loadData();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save target");
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  // Calculate totals
  const summary = useMemo(() => {
    let totalTarget = 0;
    let totalActual = 0;

    artists.forEach((artist) => {
      const targetVal = targets[artist.Name] || 0;
      const actualVal = actualSales[artist.Name] || 0;
      totalTarget += targetVal;
      totalActual += actualVal;
    });

    const percent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalActual,
      percentage: percent,
    };
  }, [artists, actualSales, targets]);

  // Filtered list
  const filteredArtists = useMemo(() => {
    return artists.filter((a) =>
      a.Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [artists, searchQuery]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Artist Targets</Text>
          <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={Theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Date Selector Row */}
        <View style={styles.dateSelectorRow}>
          <View style={styles.dateSelectorWrapper}>
            <Text style={styles.dateLabel}>FROM</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={Theme.primary} />
              <Text style={styles.dateText}>{fromDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateSelectorWrapper}>
            <Text style={styles.dateLabel}>TO</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={Theme.primary} />
              <Text style={styles.dateText}>{toDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Actual Sales</Text>
              <Text style={[styles.summaryVal, { color: Theme.success }]}>
                {formatCurrency(summary.totalActual)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Targets Set</Text>
              <Text style={[styles.summaryVal, { color: Theme.primary }]}>
                {formatCurrency(summary.totalTarget)}
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Completion</Text>
              <Text style={styles.progressVal}>{summary.percentage.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, summary.percentage)}%`,
                    backgroundColor: summary.percentage >= 100 ? Theme.success : Theme.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={Theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artists..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Theme.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* List of Artists */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredArtists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={Theme.textMuted} />
                <Text style={styles.emptyText}>No artists found</Text>
              </View>
            ) : (
              filteredArtists.map((artist) => {
                const targetVal = targets[artist.Name] || 0;
                const actualVal = actualSales[artist.Name] || 0;
                const percent = targetVal > 0 ? (actualVal / targetVal) * 100 : 0;

                return (
                  <View key={artist.DishId} style={styles.artistCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.artistName}>{artist.Name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setSelectedArtist(artist);
                          setTargetInput(targetVal > 0 ? targetVal.toString() : "");
                          setShowEditModal(true);
                        }}
                      >
                        <Ionicons name="create-outline" size={16} color={Theme.primary} />
                        <Text style={styles.editBtnText}>Set Target</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardValuesRow}>
                      <View>
                        <Text style={styles.valLabel}>ACTUAL SALES</Text>
                        <Text style={styles.valActual}>{formatCurrency(actualVal)}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.valLabel}>TARGET</Text>
                        <Text style={styles.valTarget}>{formatCurrency(targetVal)}</Text>
                      </View>
                    </View>

                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, percent)}%`,
                            backgroundColor: percent >= 100 ? Theme.success : Theme.primary,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.cardFooter}>
                      <Text style={styles.completionText}>
                        {percent > 0
                          ? `${percent.toFixed(1)}% Reached`
                          : targetVal > 0
                          ? "0% Reached"
                          : "No Target Set"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Target Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Target for {selectedArtist?.Name}</Text>
            <Text style={styles.modalSubtitle}>Enter target amount for sales tracking</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="0.00"
                value={targetInput}
                onChangeText={setTargetInput}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedArtist(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveTarget}
              >
                <Text style={styles.saveBtnText}>Save Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Date Pickers (Custom fallback for Expo Web/Desktop compatibility) */}
      <DatePickerModal
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        selectedDate={fromDate}
        onSelect={(date: Date) => {
          setFromDate(date);
          setShowFromPicker(false);
        }}
        title="Select From Date"
      />

      <DatePickerModal
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        selectedDate={toDate}
        onSelect={(date: Date) => {
          setToDate(date);
          setShowToPicker(false);
        }}
        title="Select To Date"
      />
    </View>
  );
}

// Simple Custom DatePicker Modal to ensure maximum cross-platform compatibility without third party native dependencies
function DatePickerModal({ visible, onClose, selectedDate, onSelect, title }: any) {
  const [tempDate, setTempDate] = useState(() => new Date(selectedDate));
  
  useEffect(() => {
    if (visible) setTempDate(new Date(selectedDate));
  }, [visible, selectedDate]);

  const changeDay = (amount: number) => {
    const d = new Date(tempDate);
    d.setDate(d.getDate() + amount);
    setTempDate(d);
  };

  const handleConfirm = () => {
    onSelect(tempDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { padding: 20 }]}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.pickerRow}>
            <TouchableOpacity onPress={() => changeDay(-1)} style={styles.pickerArrow}>
              <Ionicons name="chevron-back" size={24} color={Theme.primary} />
            </TouchableOpacity>
            <Text style={styles.pickerDateText}>{tempDate.toLocaleDateString()}</Text>
            <TouchableOpacity onPress={() => changeDay(1)} style={styles.pickerArrow}>
              <Ionicons name="chevron-forward" size={24} color={Theme.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleConfirm}>
              <Text style={styles.saveBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.bgInput,
  },
  headerTitle: {
    fontFamily: Fonts.black,
    fontSize: 18,
    color: Theme.textPrimary,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.bgInput,
  },
  dateSelectorRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: Theme.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  dateSelectorWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Theme.textSecondary,
    marginBottom: 4,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.bgInput,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Theme.textPrimary,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Theme.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    ...Theme.shadowSm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Theme.textSecondary,
    marginBottom: 4,
  },
  summaryVal: {
    fontFamily: Fonts.black,
    fontSize: 18,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Theme.border,
  },
  progressContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingTop: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Theme.textSecondary,
  },
  progressVal: {
    fontFamily: Fonts.black,
    fontSize: 12,
    color: Theme.textPrimary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Theme.bgInput,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.bgCard,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Theme.textPrimary,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  artistCard: {
    backgroundColor: Theme.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    ...Theme.shadowSm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  artistName: {
    fontFamily: Fonts.black,
    fontSize: 15,
    color: Theme.textPrimary,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Theme.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Theme.primary,
  },
  cardValuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  valLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Theme.textMuted,
    marginBottom: 2,
  },
  valActual: {
    fontFamily: Fonts.black,
    fontSize: 14,
    color: Theme.success,
  },
  valTarget: {
    fontFamily: Fonts.black,
    fontSize: 14,
    color: Theme.textPrimary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  completionText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Theme.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: Fonts.bold,
    color: Theme.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: Theme.bgCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    ...Theme.shadowLg,
  },
  modalTitle: {
    fontFamily: Fonts.black,
    fontSize: 16,
    color: Theme.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Theme.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Theme.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: Theme.bgInput,
    marginBottom: 20,
  },
  dollarSign: {
    fontFamily: Fonts.black,
    fontSize: 18,
    color: Theme.primary,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.black,
    fontSize: 18,
    color: Theme.textPrimary,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: Theme.bgInput,
  },
  cancelBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Theme.textSecondary,
  },
  saveBtn: {
    backgroundColor: Theme.primary,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: "#fff",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  pickerArrow: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.bgInput,
  },
  pickerDateText: {
    fontFamily: Fonts.black,
    fontSize: 18,
    color: Theme.textPrimary,
  },
});
