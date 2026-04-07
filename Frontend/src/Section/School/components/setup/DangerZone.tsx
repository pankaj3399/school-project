import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle, ShieldAlert, Lock } from "lucide-react";

interface DangerZoneProps {
  onResetRoster: () => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({ onResetRoster }) => {
  return (
    <Card className="border-none shadow-2xl bg-white/40 backdrop-blur-md rounded-3xl overflow-hidden ring-1 ring-red-200">
      <CardHeader className="bg-red-50/50 border-b border-red-100 p-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-red-900 uppercase tracking-tight">System Danger Zone</CardTitle>
            <CardDescription className="text-red-700/70 font-medium">Critical school-wide resets and data removal</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 bg-white/60 border border-red-100 rounded-2xl">
          <div className="flex gap-4">
            <div className="mt-1">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-neutral-900">Reset Student Roster</h4>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-md">
                Permanently deletes <span className="font-bold text-red-600">ALL</span> student records, their history, and point balances from this school. 
                <span className="block mt-1 italic text-neutral-400 font-medium text-[11px]">This action is irreversible and requires administrator password verification.</span>
              </p>
            </div>
          </div>
          
          <Button 
            onClick={onResetRoster}
            className="w-full md:w-auto h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all"
          >
            <Lock className="w-4 h-4" />
            Reset Students
          </Button>
        </div>

        <div className="flex items-center gap-2 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-[10px] font-bold text-amber-700 uppercase tracking-widest">
          <AlertTriangle className="w-4 h-4" />
          Ensure you have a recent backup (CSV Export) before proceeding with any action in this section.
        </div>
      </CardContent>
    </Card>
  );
};
