import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useRegister } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function RegisterScreen() {
  const colors = useColors();
  const { toggleTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const registerMutation = useRegister();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    try {
      const result = await registerMutation.mutateAsync({
        data: { name: name.trim(), email: email.trim(), password },
      });
      await login(result.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration Failed", "Email may already be in use");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={toggleTheme}
        style={[s.themeBtn, { top: topPad + 12, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(99,102,241,0.12)" }]}
        activeOpacity={0.7}
      >
        <Ionicons name={isDark ? "sunny" : "moon"} size={18} color={isDark ? "#FCD34D" : colors.primary} />
      </TouchableOpacity>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ flexGrow: 1, paddingTop: topPad + 60, paddingBottom: bottomPad + 32, paddingHorizontal: 24, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View style={s.logoArea}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={s.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={s.logoText}>SPH</Text>
          </LinearGradient>
          <Text style={[s.appName, { color: colors.foreground }]}>Get Started</Text>
          <Text style={[s.tagline, { color: colors.mutedForeground }]}>Create your student account</Text>
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.fields}>
            {[
              { label: "FULL NAME", icon: "person-outline", value: name, onChange: setName, placeholder: "Alex Johnson", type: "default" as const, cap: "words" as const },
              { label: "EMAIL", icon: "mail-outline", value: email, onChange: setEmail, placeholder: "you@university.edu", type: "email-address" as const, cap: "none" as const },
            ].map((f) => (
              <View key={f.label} style={s.fieldGroup}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                <View style={[s.inputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Ionicons name={f.icon as any} size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[s.input, { color: colors.foreground }]}
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType={f.type}
                    autoCapitalize={f.cap}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
              <View style={[s.inputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[s.input, { color: colors.foreground, flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={registerMutation.isPending}
            activeOpacity={0.85}
            style={{ borderRadius: 14, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.btn, registerMutation.isPending && { opacity: 0.7 }]}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={s.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[s.footerLink, { color: colors.primary }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const s = StyleSheet.create({
  themeBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoArea: { alignItems: "center", marginBottom: 28, gap: 8 },
  logoGradient: { width: 76, height: 76, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  logoText: { color: "#FFF", fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  appName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular" },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  fields: { gap: 16 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: { height: 52, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  btnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
