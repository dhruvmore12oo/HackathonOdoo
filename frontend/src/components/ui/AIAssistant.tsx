'use client';

import { useState } from 'react';
import { Sparkles, Wand2, X, ChevronDown, ChevronUp, MapPin, Clock, IndianRupee, Lightbulb } from 'lucide-react';
import { Button, Input, Modal, Spinner, Badge } from '@/components/ui';
import { useGenerateItinerary, type AISuggestionResponse } from '@/hooks/useAI';

const INTERESTS = ['beach', 'city', 'mountain', 'cultural', 'adventure', 'relaxation', 'food'];

export function AIAssistantPanel({ destination, startDate, endDate, budget }: {
  destination?: string; startDate?: string; endDate?: string; budget?: number;
}) {
  const [open, setOpen] = useState(false);
  const [dest, setDest] = useState(destination || '');
  const [start, setStart] = useState(startDate || '');
  const [end, setEnd] = useState(endDate || '');
  const [budgetVal, setBudgetVal] = useState(budget?.toString() || '');
  const [interests, setInterests] = useState<string[]>([]);
  const [result, setResult] = useState<AISuggestionResponse | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const { mutate: generate, isPending } = useGenerateItinerary();

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleGenerate = () => {
    generate({
      destination: dest, startDate: start, endDate: end,
      budget: budgetVal ? Number(budgetVal) : undefined,
      interests: interests.length ? interests : undefined,
    }, {
      onSuccess: (data) => {
        setResult(data);
        setExpandedDay(1);
      },
    });
  };

  return (
    <>
      <Button
        variant="outline" size="sm"
        leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
        onClick={() => setOpen(true)}
        className="border-amber-200 text-amber-700 hover:bg-amber-50"
      >
        AI Assistant
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="" size="lg">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Trip Assistant</h2>
              <p className="text-xs text-gray-400">Generate smart itinerary suggestions</p>
            </div>
          </div>

          {!result ? (
            <>
              {/* Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Destination" value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. Thailand" />
                <Input label="Budget" type="number" value={budgetVal} onChange={e => setBudgetVal(e.target.value)} placeholder="Optional" />
                <Input label="Start Date" type="date" value={start} onChange={e => setStart(e.target.value)} />
                <Input label="End Date" type="date" value={end} onChange={e => setEnd(e.target.value)} />
              </div>

              {/* Interests */}
              <div>
                <label className="label-base mb-2 block">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(i => (
                    <button
                      key={i}
                      onClick={() => toggleInterest(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        interests.includes(i)
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                isLoading={isPending}
                disabled={!dest || !start || !end}
                onClick={handleGenerate}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Generate Itinerary
              </Button>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Budget Estimate */}
                {result.estimatedBudget && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-800">Estimated Budget</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      {result.estimatedBudget.currency} {Math.round(result.estimatedBudget.min).toLocaleString()} – {Math.round(result.estimatedBudget.max).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Days */}
                {result.itinerary.map(day => (
                  <div key={day.day} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-bold">{day.day}</div>
                        <span className="font-semibold text-sm text-gray-900">{day.title}</span>
                      </div>
                      {expandedDay === day.day ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {expandedDay === day.day && (
                      <div className="p-4 space-y-3">
                        {day.sections.map((sec, si) => (
                          <div key={si}>
                            <Badge className="text-[10px] mb-2 bg-amber-50 text-amber-700">{sec.type} — {sec.title}</Badge>
                            <div className="space-y-2 pl-2 border-l-2 border-amber-100">
                              {sec.activities.map((act, ai) => (
                                <div key={ai} className="text-sm space-y-0.5">
                                  <p className="font-medium text-gray-800">{act.name}</p>
                                  <p className="text-xs text-gray-400">{act.description}</p>
                                  <div className="flex gap-3 text-[10px] text-gray-400">
                                    {act.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{act.location}</span>}
                                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{act.durationHours}h</span>
                                    <span className="flex items-center gap-0.5"><IndianRupee className="h-2.5 w-2.5" />~{act.estimatedCost}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Tips */}
                {result.tips.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-800">Travel Tips</span>
                    </div>
                    <ul className="space-y-1">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                  Regenerate
                </Button>
                <Button className="flex-1" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
