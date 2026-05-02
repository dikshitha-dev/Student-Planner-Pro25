import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useGetTimetable,
  useCreateTimetableEntry,
  useDeleteTimetableEntry,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTimetableQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 to 21:00
const COLORS = [
  "#6366F1", "#8B5CF6", "#06B6D4", "#10B981",
  "#F59E0B", "#EF4444", "#EC4899", "#3B82F6",
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const HOUR_HEIGHT = 60;
const START_HOUR = 6;

export default function TimetableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const { data: entries, isLoading } = useGetTimetable();
  const createMutation = useCreateTimetableEntry();
  const deleteMutation = useDeleteTimetableEntry();

  const [showModal, setShowModal] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]!);

  const handleCreate = async () => {
    if (!subjectName.trim()) {
      Alert.alert("Error", "Please enter a subject name");
      return;
    }
    try {
      await createMutation.mutateAsync({
        data: {
          subjectName: subjectName.trim(),
          dayOfWeek: selectedDay,
          startTime,
          endTime,
          color: selectedColor,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetTimetableQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setSubjectName("");
    } catch {
      Alert.alert("Error", "Failed to add entry");
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id });
          queryClient.invalidateQueries({ queryKey: getGetTimetableQueryKey() });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const COL_WIDTH = 44;
  const LABEL_WIDTH = 38;
  const totalHeight = HOURS.length * HOUR_HEIGHT;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: topPad + 20, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground }}>Schedule</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12, width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
            {/* Day headers */}
            <View style={{ flexDirection: "row", paddingLeft: LABEL_WIDTH, paddingBottom: 8 }}>
              {DAYS.map((d, i) => (
                <View key={i} style={{ width: COL_WIDTH, alignItems: "center" }}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            <View style={{ flexDirection: "row" }}>
              {/* Time labels */}
              <View style={{ width: LABEL_WIDTH }}>
                {HOURS.map((h) => (
                  <View key={h} style={{ height: HOUR_HEIGHT, justifyContent: "flex-start" }}>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                      {h.toString().padStart(2, "0")}:00
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day columns */}
              {DAYS.map((_, dayIdx) => {
                const dayEntries = (entries ?? []).filter((e) => e.dayOfWeek === dayIdx);
                return (
                  <View key={dayIdx} style={{ width: COL_WIDTH, height: totalHeight, position: "relative" }}>
                    {/* Hour lines */}
                    {HOURS.map((h) => (
                      <View
                        key={h}
                        style={{
                          position: "absolute",
                          top: (h - START_HOUR) * HOUR_HEIGHT,
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: colors.border,
                        }}
                      />
                    ))}
                    {/* Entries */}
                    {dayEntries.map((entry) => {
                      const startMins = timeToMinutes(entry.startTime);
                      const endMins = timeToMinutes(entry.endTime);
                      const top = (startMins - START_HOUR * 60) * (HOUR_HEIGHT / 60);
                      const height = (endMins - startMins) * (HOUR_HEIGHT / 60);
                      return (
                        <TouchableOpacity
                          key={entry.id}
                          style={{
                            position: "absolute",
                            top,
                            left: 2,
                            right: 2,
                            height: Math.max(height, 20),
                            backgroundColor: entry.color + "DD",
                            borderRadius: 6,
                            padding: 3,
                            overflow: "hidden",
                          }}
                          onLongPress={() => handleDelete(entry.id, entry.subjectName)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#FFF" }} numberOfLines={2}>
                            {entry.subjectName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" }}>
          <View style={[mStyles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <Text style={[mStyles.modalTitle, { color: colors.foreground }]}>Add Class</Text>

            <Text style={[mStyles.mLabel, { color: colors.mutedForeground }]}>Subject Name</Text>
            <TextInput
              style={[mStyles.mInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
              value={subjectName}
              onChangeText={setSubjectName}
              placeholder="e.g. Mathematics"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[mStyles.mLabel, { color: colors.mutedForeground }]}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {DAYS.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[mStyles.dayChip, {
                    backgroundColor: selectedDay === i ? colors.primary : colors.secondary,
                    borderColor: selectedDay === i ? colors.primary : colors.border,
                  }]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={{ color: selectedDay === i ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[mStyles.mLabel, { color: colors.mutedForeground }]}>Start</Text>
                <TextInput
                  style={[mStyles.mInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[mStyles.mLabel, { color: colors.mutedForeground }]}>End</Text>
                <TextInput
                  style={[mStyles.mInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <Text style={[mStyles.mLabel, { color: colors.mutedForeground }]}>Color</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[mStyles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 2 : 0, borderColor: "#FFF" }]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={[mStyles.mBtn, { backgroundColor: colors.secondary, flex: 1 }]} onPress={() => setShowModal(false)}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[mStyles.mBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold" }}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const mStyles = StyleSheet.create({
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  mLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6, letterSpacing: 0.3 },
  mInput: { height: 44, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, fontFamily: "Inter_400Regular", borderWidth: 1, marginBottom: 16 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  mBtn: { height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
