import { Header } from '@/components/Header';
import { Card, H, Screen, T } from '@/components/ui';

export default function Entreno() {
  return (
    <Screen header={<Header subtitle="Tu rutina" />}>
      <Card hero>
        <H>Entreno</H>
        <T kind="mut" style={{ marginTop: 6 }}>
          Split, series y temporizador de descanso llegan en la fase F5.
        </T>
      </Card>
    </Screen>
  );
}
