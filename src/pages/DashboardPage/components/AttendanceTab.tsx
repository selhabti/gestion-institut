// pages/DashboardPage/components/AttendanceTab.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { AttendanceSearch } from "@/components/attendance/AttendanceSearch";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session";
import { lazyImport } from "@/utils/lazyImport";

// Import lazy comme dans l'original
const LazyMembersTable = lazyImport(() => import("@/components/MembersTable"));

interface AttendanceTabProps {
  filteredMembers: Member[];
  selectedGroup: SessionType;
  currentDateString: string;
  // ✅ Changé 'any' en 'AttendanceStatus'
  onMarkPresent: (
    memberId: string, 
    date: string, 
    status: AttendanceStatus, 
    session_type?: SessionType
  ) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  shareMode: boolean;
  historicalEditMode: boolean;
  onHistoricalEditToggle: (enabled: boolean) => void;
  members: Member[];
  loading: boolean;
  // ✅ NOUVELLES PROPS AJOUTÉES (optionnelles)
  onTransferAttendance?: (
    memberId: string,
    fromDate: string,
    toDate: string,
    fromGroup: SessionType,
    toGroup: SessionType
  ) => void;
  onAutoTransferAbsent?: () => void;
}

export const AttendanceTab = ({
  filteredMembers,
  selectedGroup,
  currentDateString,
  onMarkPresent,
  onMarkPayment,
  onUnmarkPayment,
  shareMode,
  historicalEditMode,
  onHistoricalEditToggle,
  members,
  loading,
  // ✅ NOUVELLES PROPS AJOUTÉES
  onTransferAttendance,
  onAutoTransferAbsent,
}: AttendanceTabProps) => {
  return (
    <Tabs defaultValue="table" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="table">Tableau complet</TabsTrigger>
        <TabsTrigger value="search">Recherche & Ajout</TabsTrigger>
      </TabsList>
      
      <TabsContent value="table">
        <Card className="border border-slate-300 shadow-sm">
          <CardContent className="p-0">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-slate-600">Chargement du tableau...</span>
                </div>
              }
            >
              <LazyMembersTable
                members={filteredMembers}
                selectedGroup={selectedGroup}
                currentDate={currentDateString}
                onMarkPresent={onMarkPresent}
                onMarkPayment={onMarkPayment}
                onUnmarkPayment={onUnmarkPayment}
                isAdmin={true}
                canManageMembers={true}
                shareMode={shareMode}
                historicalEditMode={historicalEditMode}
                onHistoricalEditToggle={onHistoricalEditToggle}
                onTransferAttendance={onTransferAttendance}
                onAutoTransferAbsent={onAutoTransferAbsent}
              />
            </Suspense>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="search">
        <Card className="border border-slate-300 shadow-sm">
          <CardContent className="p-6">
            <AttendanceSearch
              allMembers={members}
              selectedGroup={selectedGroup}
              currentDate={currentDateString}
              onMarkAttendance={onMarkPresent}
              onMarkPayment={onMarkPayment}
              onUnmarkPayment={onUnmarkPayment}
              isLoading={loading}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};