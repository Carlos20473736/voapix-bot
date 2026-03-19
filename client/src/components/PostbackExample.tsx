/**
 * Exemplo de Uso: Diálogo + Painel de Verificação
 * Mostra como integrar os componentes de postback na aplicação
 */

import React, { useState } from "react";
import { PostbackYmidDialog } from "./PostbackYmidDialog";
import { PostbackVerificationPanel } from "./PostbackVerificationPanel";

export function PostbackExample() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [botUnlocked, setBotUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">VoaPix Bot</h1>
          <p className="text-slate-400">Automação com Verificação Monetag</p>
        </div>

        {/* Main Button */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-center mb-6">
          {!botUnlocked ? (
            <>
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/50 mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Bot Bloqueado
              </h2>
              <p className="text-slate-400 mb-6">
                Complete as tarefas no Young Money para desbloquear o bot
              </p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Gerar YMID e Verificar
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 mb-4">
                  <span className="text-3xl">✓</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">
                Bot Desbloqueado
              </h2>
              <p className="text-slate-400 mb-6">
                Suas tarefas foram verificadas com sucesso!
              </p>
              <button
                onClick={() => {
                  setBotUnlocked(false);
                  setIsDialogOpen(false);
                }}
                className="px-8 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-all duration-200"
              >
                Reiniciar Verificação
              </button>
            </>
          )}
        </div>

        {/* Verification Panel */}
        {isDialogOpen && (
          <div className="mb-6">
            <PostbackVerificationPanel showLogs={true} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-xs mt-2 underline"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Dialog */}
        <PostbackYmidDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onBotUnlocked={() => {
            setBotUnlocked(true);
            setIsDialogOpen(false);
          }}
          onError={(err) => setError(err)}
        />

        {/* Info Section */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Como Funciona</h3>
          <ol className="space-y-3 text-slate-300 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-400">
                1
              </span>
              <span>
                Clique em "Gerar YMID e Verificar" para gerar um ID único
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-400">
                2
              </span>
              <span>
                Copie o código e clique em "Acessar Young Money" para completar
                as tarefas
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-400">
                3
              </span>
              <span>
                O bot verifica automaticamente a cada 5 segundos se você completou
                as tarefas
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-400">
                4
              </span>
              <span>
                Quando atingir 20 impressões + 2 cliques, o bot é automaticamente
                desbloqueado
              </span>
            </li>
          </ol>
        </div>

        {/* Requirements */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Requisitos</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">20</div>
              <div className="text-sm text-slate-400">Impressões Mínimas</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">2</div>
              <div className="text-sm text-slate-400">Cliques Mínimos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

