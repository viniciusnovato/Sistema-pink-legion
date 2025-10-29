'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, Euro } from 'lucide-react'

export interface AdditionalCost {
  id: string
  name: string
  value: number
}

interface AdditionalCostsProps {
  costs: AdditionalCost[]
  onChange: (costs: AdditionalCost[]) => void
}

export function AdditionalCosts({ costs, onChange }: AdditionalCostsProps) {
  const addCost = () => {
    const newCost: AdditionalCost = {
      id: Date.now().toString(),
      name: '',
      value: 0
    }
    onChange([...costs, newCost])
  }

  const removeCost = (id: string) => {
    onChange(costs.filter(cost => cost.id !== id))
  }

  const updateCost = (id: string, field: 'name' | 'value', value: string | number) => {
    onChange(
      costs.map(cost =>
        cost.id === id ? { ...cost, [field]: value } : cost
      )
    )
  }

  const getTotalCosts = () => {
    return costs.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
          Custos Adicionais
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCost}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Custo
        </Button>
      </div>

      {costs.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
          <Euro className="h-8 w-8 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-2" />
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Nenhum custo adicional. Clique em "Adicionar Custo" para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {costs.map((cost) => (
            <div
              key={cost.id}
              className="flex gap-2 items-start p-3 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark"
            >
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Nome do custo (ex: Reparos, Pintura)"
                  value={cost.name}
                  onChange={(e) => updateCost(cost.id, 'name', e.target.value)}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                    €
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cost.value || ''}
                    onChange={(e) => updateCost(cost.id, 'value', parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeCost(cost.id)}
                className="mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between items-center pt-3 border-t border-border-light dark:border-border-dark">
            <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              Total de Custos Adicionais:
            </span>
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {getTotalCosts().toLocaleString('pt-PT', {
                style: 'currency',
                currency: 'EUR'
              })}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
        Os custos adicionais serão somados ao preço de compra para calcular o custo total do veículo.
      </p>
    </div>
  )
}


