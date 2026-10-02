import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js dev server by default doveruje len "localhost" - pristup z
  // telefonu cez LAN IP adresu (napr. pri testovani na mobile) bez tohto
  // zablokuje HMR websocket aj cast requestov na JS/asset subory, co
  // vysledne rozbije hydratáciu (stranka sa zobrazi, ale nic nereaguje
  // na dotyk). Hviezdicka = lubovolne posledne cislo IP adresy - router
  // pridava Macu zakazdym inu adresu v tej istej sieti (.53, .56, .60...),
  // takto netreba config upravovat pri kazdej zmene. Plati len pre dev server.
  allowedDevOrigins: ["192.168.68.*", "192.168.8.*"],
};

export default nextConfig;
