import { Header } from '@/components/Header';
import { Card, H, Screen, T } from '@/components/ui';

export default function Aprende() {
  return (
    <Screen header={<Header subtitle="Guía de nutrición" />}>
      <Card hero>
        <H>Aprende</H>
        <T kind="mut" style={{ marginTop: 6 }}>
          La guía con tus números llega en la fase F6.
        </T>
      </Card>
    </Screen>
  );
}
