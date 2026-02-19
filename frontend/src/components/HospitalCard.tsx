import { MapPin, Clock, Droplets, Heart, Star } from 'lucide-react';

interface Hospital {
  name: string;
  rating: number;
  response: number;
  icu: number;
  blood: number;
  distance: number;
  explanation: string;
}

interface HospitalCardProps {
  hospital: Hospital;
  onSelect: (hospital: Hospital) => void;
}

const HospitalCard = ({ hospital, onSelect }: HospitalCardProps) => {
  return (
    <div className="card-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{hospital.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">
                {hospital.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-gray-500">•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-700">{hospital.distance} km</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-gray-100">
        <div className="flex flex-col items-center">
          <Clock className="w-5 h-5 text-blue-500 mb-1" />
          <span className="text-2xl font-bold text-gray-900">{hospital.response}</span>
          <span className="text-xs text-gray-600 text-center">Response time (min)</span>
        </div>
        <div className="flex flex-col items-center">
          <Heart className="w-5 h-5 text-red-500 mb-1" />
          <span className="text-2xl font-bold text-gray-900">{hospital.icu}</span>
          <span className="text-xs text-gray-600 text-center">ICU beds</span>
        </div>
        <div className="flex flex-col items-center">
          <Droplets className="w-5 h-5 text-red-600 mb-1" />
          <span className="text-2xl font-bold text-gray-900">{hospital.blood}</span>
          <span className="text-xs text-gray-600 text-center">Blood units</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed italic">
          "{hospital.explanation}"
        </p>
      </div>

      <button
        onClick={() => onSelect(hospital)}
        className="w-full btn-primary py-3 font-semibold"
      >
        Select Hospital
      </button>
    </div>
  );
};

export default HospitalCard;
