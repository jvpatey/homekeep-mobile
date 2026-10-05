import { Alert, Linking } from "react-native";
import { HomeContact, dialablePhone } from "../../types/homeContact";

async function open(url: string, failure: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Can't open", failure);
  }
}

export function canCall(contact: Pick<HomeContact, "phone">) {
  return dialablePhone(contact.phone) !== null;
}

export function callContact(contact: Pick<HomeContact, "phone">) {
  const phone = dialablePhone(contact.phone);
  if (phone) void open(`tel:${phone}`, "This device can't make calls.");
}

export function textContact(contact: Pick<HomeContact, "phone">) {
  const phone = dialablePhone(contact.phone);
  if (phone) void open(`sms:${phone}`, "This device can't send messages.");
}

export function emailContact(contact: Pick<HomeContact, "email">) {
  const email = contact.email?.trim();
  if (email) void open(`mailto:${email}`, "No mail app is set up.");
}

export function openWebsite(contact: Pick<HomeContact, "website">) {
  const raw = contact.website?.trim();
  if (!raw) return;
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  void open(url, "Couldn't open the website.");
}
