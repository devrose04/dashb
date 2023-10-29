import { useEffect, useState } from 'react';
import StockChart from '../widgets/StockChart/StockChart';
import Weather from '../widgets/Weather/Weather';
import ProtectedPage from './ProtectedPage';
import AirQuality from '../widgets/AirQuality/AirQuality';
import Toggl from '../widgets/Toggl/Toggl';

import GridLayout, { WidthProvider, Responsive } from 'react-grid-layout';
import Embed from '../widgets/Embed/Embed';
import LofiPlayer from '../widgets/LofiPlayer/LofiPlayer';
import Note from '../widgets/Note/Note';
import { Widget } from '../widgets';
import AddWidgetModal from '../components/base/AddWidgetModal/AddWidgetModal';
import { PubSubEvent, useSub } from '../hooks/usePubSub';
import { getLS } from '../utils/appUtils';
import { DefaultLayout, DefaultWidgets } from '../utils/constants';
import { deleteSettings } from '../hooks/useWidgetSettings';
import StockMini from '../widgets/StockMini/StockMini';
import { saveTabDB, saveTabLS } from './MainPageUtils';
import { apiGet } from '../utils/apiUtils';
const ResponsiveGridLayout = WidthProvider(Responsive);

export default function MainPage() {
  const [modalShowed, setModalShowed] = useState(false);
  const [tab, setTab] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const [userWidgets, setUserWidgets] = useState<any>(getLS(`userWidgets${tab}`, DefaultWidgets, true));
  const [layout, setLayout] = useState<any>(getLS(`userLayout${tab}`, DefaultLayout, true));

  useEffect(() => {
    const fetchUserSettings = async () => {
      setIsReady(false);
      const token = localStorage.getItem('tk') ?? '';
      if (token) {
        const { data } = await apiGet('/api/user/settings', {
          options: {
            headers: {
              authorization: `Bearer ${localStorage.getItem('tk')}`
            }
          }
        });
        const newWidgets = data.userWidgets.length > 0 ? data.userWidgets : DefaultWidgets;
        const newLayout = data.userLayout.length > 0 ? data.userLayout : DefaultLayout;
        saveTabLS(0, newWidgets, newLayout);
        setUserWidgets(newWidgets);
        setLayout(newLayout);
        console.log('-- isReady', data);
      }
      setIsReady(true);
    };
    fetchUserSettings();
  }, []);
  // console.log('isReady', isReady, userWidgets, layout);

  useSub(PubSubEvent.Delete, async (wid: string) => {
    if (confirm('Delete this widget?') === true) {
      const newLayout = layout.filter((item: any) => item.i !== wid);
      const newUserWidgets = userWidgets.filter((item: Widget) => item?.info?.wid !== wid);
      setLayout([...newLayout]);
      setUserWidgets([...newUserWidgets]);
      saveTabLS(tab, newUserWidgets, newLayout);
      deleteSettings(wid);
    }
  });

  const addWidget = (widget: Widget | null) => {
    setModalShowed(false);
    // console.log('widget', widget);
    if (widget) {
      const wid = widget?.info?.wid + '-' + Math.random();
      userWidgets.push({
        wid
      });
      layout.push({ i: wid, x: 0, y: 0, w: 1, h: 1 });
      setLayout(layout);
      saveTabLS(tab, userWidgets, layout);
    }
  };
  return (
    <ProtectedPage>
      <div>
        {isReady && userWidgets.length > 0 && layout.length > 0 && (
          <GridLayout
            draggableHandle=".draggableHandle"
            className="layout"
            layout={layout}
            cols={4}
            rowHeight={200}
            width={1600}
            margin={[20, 20]}
            onLayoutChange={(layout) => {
              saveTabLS(tab, userWidgets, layout);
              saveTabDB(tab, userWidgets, layout);
            }}
            isResizable={false}
          >
            {userWidgets.map((widget: Widget, idx: number) => {
              const wid = widget?.wid ?? '';
              const type = wid.split('-')[0];
              const cn = ``;
              switch (type) {
                case 'weather':
                  return (
                    <div key={wid} className={cn}>
                      <Weather key={`${wid}-main`} wid={wid} defaultCity="New York" />
                    </div>
                  );
                case 'airq':
                  return (
                    <div key={wid} className={cn}>
                      <AirQuality key={`${wid}-main`} wid={wid} />
                    </div>
                  );
                case 'embed':
                  return (
                    <div key={wid} className={cn} data-grid={{ x: 2, y: 0, w: 1, h: 2 }}>
                      <Embed key={`${wid}-main`} wid={wid} />
                    </div>
                  );
                case 'lofi':
                  return (
                    <div key={wid} className={cn}>
                      <LofiPlayer key={`${wid}-main`} wid={wid} />
                    </div>
                  );
                case 'note':
                  return (
                    <div key={wid} className={cn}>
                      <Note key={`${wid}-main`} wid={wid} />
                    </div>
                  );
                case 'stock':
                  return (
                    <div key={wid} className={cn}>
                      <StockChart key={`${wid}-main`} wid={wid} symbol="SPY" />
                    </div>
                  );
                case 'stockmini':
                  return (
                    <div key={wid} className={cn}>
                      <StockMini key={`${wid}-main`} wid={wid} symbol="SPY" />
                    </div>
                  );
                case 'toggl':
                  return (
                    <div key={wid} className={cn}>
                      <Toggl key={`${wid}-main`} wid={wid} />
                    </div>
                  );
                case 'BREAK':
                  return (
                    <div key={idx}>
                      <div key={`${idx}-main`} className="basis-full"></div>
                    </div>
                  );
              }
            })}
          </GridLayout>
        )}
      </div>

      <button className="btn ml-4 mb-4" onClick={() => setModalShowed(true)}>
        Add Widget
      </button>

      {modalShowed && <AddWidgetModal onCancel={() => setModalShowed(false)} onConfirm={addWidget} />}
    </ProtectedPage>
  );
}