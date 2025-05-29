import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const WeatherScreen = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = '3bc8244c'; 
  const CITY = 'recife';

  
  const createMockData = () => {
    const currentDate = new Date();
    return {
      city: 'Fortaleza',
      currentTemp: '28°',
      description: 'Parcialmente nublado',
      condition: 'cloudly_day',
      precipitation: '8%',
      humidity: '30%',
      wind: '18 km/h',
      maxMin: 'Max.: 31° Min.: 28°',
      todayForecast: [
        { time: '09:00', temp: '29°C', condition: 'cloudly_day' },
        { time: '12:00', temp: '31°C', condition: 'clear_day' },
        { time: '15:00', temp: '30°C', condition: 'cloudly_day' },
        { time: '18:00', temp: '27°C', condition: 'cloudly_night' },
      ],
      nextForecast: [
        { day: 'segunda', temp: '29°: 26°', condition: 'rain' },
        { day: 'terça', temp: '28°: 25°', condition: 'storm' },
      ],
      date: currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      sunrise: '05:30',
      sunset: '17:45'
    };
  };

  
  const formatDate = (dateString) => {
    try {
      if (!dateString) return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) 
        : date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    } catch {
      return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }
  };


const safeTemperature = (temp, unit = '°') => {

  if (temp === undefined || temp === null) {
    return `--${unit}`;
  }

  
  const numericValue = parseFloat(String(temp).replace(/[^\d.-]/g, ''));

 
  if (isNaN(numericValue)) {
    return `-${unit}`;
  }

  
  const roundedTemp = Math.round(numericValue);
  

  if (roundedTemp < -100 || roundedTemp > 100) {
    return `-${unit}`;
  }


  if (unit === '°C' || unit === '°F') {
    return `${roundedTemp}${unit}`;
  }
  
  return `${roundedTemp}${unit}`;
};

  const processAPIData = (data) => {
    try {
      const forecastToday = data.forecast?.[0] || {};
      return {
        city: data.city_name || 'Fortaleza',
        currentTemp: safeTemperature(data.temp),
        description: data.description || 'Condição desconhecida',
        condition: data.condition_slug || 'cloudly_day',
        precipitation: data.rain !== undefined ? `${data.rain}%` : '0%',
        humidity: `${data.humidity || '--'}%`,
        wind: data.wind_speedy || '-- km/h',
        maxMin: `Max.: ${safeTemperature(forecastToday.max)} Min.: ${safeTemperature(forecastToday.min)}`,
        todayForecast: [
          { time: '09:00', temp: safeTemperature(forecastToday.morning, '°C'), condition: forecastToday.condition || 'cloudly_day' },
          { time: '12:00', temp: safeTemperature(forecastToday.afternoon, '°C'), condition: forecastToday.condition || 'clear_day' },
          { time: '15:00', temp: safeTemperature(forecastToday.evening, '°C'), condition: forecastToday.condition || 'cloudly_day' },
          { time: '18:00', temp: safeTemperature(forecastToday.night, '°C'), condition: forecastToday.condition || 'cloudly_night' },
        ],
        nextForecast: (data.forecast?.slice(1, 3) || []).map(day => ({
          day: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }).split('-')[0],
          temp: `${safeTemperature(day.max)}: ${safeTemperature(day.min)}`,
          condition: day.condition || 'cloudly_day'
        })),
        date: formatDate(data.date),
        sunrise: data.sunrise || '-:--',
        sunset: data.sunset || '-:--'
      };
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      return createMockData();
    }
  };

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `https://api.hgbrasil.com/weather?key=${API_KEY}&city_name=${CITY}`,
        { timeout: 5000 }
      );
      
      if (!response.data?.results) throw new Error('Dados inválidos');
      setWeatherData(processAPIData(response.data.results));
      
    } catch (err) {
      setError(err.message === 'Network Error' ? 'Sem conexão' : 'Erro ao carregar');
      setWeatherData(processAPIData(createMockData())); 
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  const getWeatherIcon = (condition) => {
    const iconMap = {
      'clear_day': 'sunny',
      'clear_night': 'moon',
      'rain': 'rainy',
      'snow': 'snow',
      'sleet': 'snow',
      'wind': 'flag',
      'fog': 'cloudy',
      'cloudly_day': 'partly-sunny',
      'cloudly_night': 'cloudy-night',
      'storm': 'thunderstorm',
      'hail': 'snow'
    };

    const iconName = iconMap[condition] || 'thermometer';
    return <Ionicons name={iconName} size={24} color="#555" />;
  };

  if (loading && !weatherData) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando dados meteorológicos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.warningText}>Dados mockados estão sendo exibidos</Text>
        <Ionicons 
          name="refresh-circle-outline" 
          size={48} 
          color="#3B82F6" 
          onPress={fetchWeatherData}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }
  
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      <Text style={styles.city}>{weatherData.city}</Text>
      
      <View style={styles.currentWeather}>
        <Text style={styles.currentTemp}>{weatherData.currentTemp}</Text>
        <View style={styles.weatherCondition}>
          {getWeatherIcon(weatherData.condition)}
          <Text style={styles.weatherDescription}>{weatherData.description}</Text>
        </View>
      </View>
      
      <View style={styles.weatherInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="water-outline" size={20} color="#555" />
          <Text style={styles.infoText}>Chuva: {weatherData.precipitation}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="thermometer-outline" size={20} color="#555" />
          <Text style={styles.infoText}>Umidade: {weatherData.humidity}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="flag-outline" size={20} color="#555" />
          <Text style={styles.infoText}>Vento: {weatherData.wind}</Text>
        </View>
      </View>
      
      <View style={styles.sunTimes}>
        <View style={styles.sunTimeItem}>
          <Ionicons name="sunny-outline" size={20} color="#F59E0B" />
          <Text style={styles.sunTimeText}>Nascer: {weatherData.sunrise}</Text>
        </View>
        <View style={styles.sunTimeItem}>
          <Ionicons name="moon-outline" size={20} color="#6B7280" />
          <Text style={styles.sunTimeText}>Pôr: {weatherData.sunset}</Text>
        </View>
      </View>
      
      <Text style={styles.maxMin}>{weatherData.maxMin}</Text>

      <Text style={styles.sectionTitle}>Hoje {weatherData.date}</Text>
      <View style={styles.todayForecast}>
        {weatherData.todayForecast.map((item, index) => (
          <View key={index} style={styles.forecastItem}>
            <Text style={styles.forecastTime}>{item.time}</Text>
            {getWeatherIcon(item.condition)}
            <Text style={styles.forecastTemp}>{item.temp}</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>Próximos Dias</Text>
      <View style={styles.nextForecast}>
        {weatherData.nextForecast.map((item, index) => (
          <View key={index} style={styles.nextForecastItem}>
            <View style={styles.nextForecastDayContainer}>
              {getWeatherIcon(item.condition)}
              <Text style={styles.nextForecastDay}>
                {item.day.split('-')[0]} 
              </Text>
            </View>
            <Text style={styles.nextForecastTemp}>{item.temp}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 14,
    marginTop: 5,
  },
  city: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#1F2937',
  },
  currentWeather: {
    alignItems: 'center',
    marginVertical: 10,
  },
  currentTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weatherCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  weatherDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 5,
    textTransform: 'capitalize',
  },
  weatherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  infoItem: {
    alignItems: 'center',
    minWidth: 100,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  sunTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  sunTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sunTimeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 5,
  },
  maxMin: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    color: '#1F2937',
  },
  todayForecast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  forecastItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
    color: '#1F2937',
  },
  nextForecast: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  nextForecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nextForecastDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextForecastDay: {
    fontSize: 16,
    marginLeft: 10,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  nextForecastTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default WeatherScreen;
