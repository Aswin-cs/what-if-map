"use client";
import { useParams } from 'next/navigation';
import ScenarioMapView from '../../components/ScenarioMapView';

export default function HistoryMapPage() {
  const { object_id } = useParams();
  return <ScenarioMapView scenarioId={object_id} />;
}
