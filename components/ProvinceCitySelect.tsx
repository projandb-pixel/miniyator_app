"use client";

import { useState, useEffect, useRef } from "react";

interface Province {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  province: {
    name: string;
  };
}

interface ProvinceCitySelectProps {
  selectedProvince?: string;
  selectedCity?: string;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function ProvinceCitySelect({
  selectedProvince,
  selectedCity,
  onProvinceChange,
  onCityChange,
  required = false,
  disabled = false,
}: ProvinceCitySelectProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [customCity, setCustomCity] = useState("");
  
  // جستجو
  const [provinceSearch, setProvinceSearch] = useState(selectedProvince || "");
  const [citySearch, setCitySearch] = useState(selectedCity || "");
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const provinceRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
      setProvinceSearch(selectedProvince);
    } else {
      setCities([]);
      setCustomCity("");
      setProvinceSearch("");
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
      setCitySearch(selectedCity);
    } else {
      setCitySearch("");
    }
  }, [selectedCity]);

  // بستن dropdown با کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setShowProvinceDropdown(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const response = await fetch("/api/locations/provinces");
      const data = await response.json();
      if (data.provinces) {
        setProvinces(data.provinces);
      } else if (data.error) {
        console.error("API error:", data.error, data.details);
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceName: string) => {
    try {
      setLoadingCities(true);
      setCities([]);
      const response = await fetch(
        `/api/locations/cities?provinceName=${encodeURIComponent(provinceName)}`
      );
      const data = await response.json();
      console.log("Cities API response:", data);
      if (data.cities) {
        setCities(data.cities);
        console.log(`Loaded ${data.cities.length} cities for ${provinceName}`);
        if (selectedCity && !data.cities.find((c: City) => c.name === selectedCity)) {
          setCustomCity(selectedCity);
        } else {
          setCustomCity("");
        }
      } else if (data.error) {
        console.error("API error:", data.error, data.details);
        setCities([]);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const filteredProvinces = provinces.filter((province) =>
    province.name.includes(provinceSearch)
  );

  const filteredCities = cities.filter((city) =>
    city.name.includes(citySearch)
  );

  const handleProvinceSelect = (provinceName: string) => {
    setProvinceSearch(provinceName);
    setShowProvinceDropdown(false);
    // فetch شهرها بلافاصله قبل از به‌روزرسانی state
    if (provinceName) {
      fetchCities(provinceName);
    }
    onProvinceChange(provinceName);
    onCityChange("");
    setCustomCity("");
    setCitySearch("");
    setCities([]); // Reset cities
  };

  const handleCitySelect = (cityName: string) => {
    if (cityName === "سایر") {
      setCitySearch("");
      setCustomCity("");
      onCityChange("");
      setShowCityDropdown(false);
    } else {
      setCitySearch(cityName);
      setCustomCity("");
      onCityChange(cityName);
      setShowCityDropdown(false);
    }
  };

  const handleCustomCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCity(value);
    onCityChange(value);
  };

  const isOtherSelected = selectedCity === "سایر" || (selectedCity && !cities.find(c => c.name === selectedCity));

  return (
    <div className="space-y-3">
      {/* استان */}
      <div ref={provinceRef} className="relative">
        <label className="block text-sm font-medium mb-1">
          استان {required && "*"}
        </label>
        <div className="relative">
          <input
            type="text"
            value={provinceSearch}
            onChange={(e) => {
              setProvinceSearch(e.target.value);
              setShowProvinceDropdown(true);
            }}
            onFocus={() => setShowProvinceDropdown(true)}
            disabled={disabled || loadingProvinces}
            required={required}
            placeholder="جستجو یا انتخاب استان"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {showProvinceDropdown && !disabled && !loadingProvinces && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredProvinces.length > 0 ? (
                filteredProvinces.map((province) => (
                  <div
                    key={province.id}
                    onClick={() => handleProvinceSelect(province.name)}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                      selectedProvince === province.name ? "bg-blue-100" : ""
                    }`}
                  >
                    {province.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-center">
                  استان یافت نشد
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* شهر - همیشه نمایش داده می‌شود */}
      <div ref={cityRef} className="relative">
        <label className="block text-sm font-medium mb-1">
          شهر {required && "*"}
        </label>
        {!selectedProvince && !provinceSearch ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-center text-sm text-gray-500">
            ابتدا استان را انتخاب کنید
          </div>
        ) : (selectedProvince || provinceSearch) && loadingCities ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-center text-sm text-gray-500">
            در حال بارگذاری...
          </div>
        ) : (selectedProvince || provinceSearch) && cities.length === 0 && !loadingCities ? (
          <>
            <div className="relative">
              <input
                type="text"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(false);
                }}
                onFocus={() => {
                  setShowCityDropdown(false);
                }}
                disabled={disabled || loadingCities}
                required={required}
                placeholder="نام شهر را وارد کنید"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-xs text-yellow-600 mt-1">شهر در لیست یافت نشد. نام شهر را به صورت دستی وارد کنید.</p>
          </>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => {
                  if (cities.length > 0) {
                    setShowCityDropdown(true);
                  }
                }}
                disabled={disabled || loadingCities}
                required={required}
                placeholder="جستجو یا انتخاب شهر"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {showCityDropdown && !disabled && !loadingCities && cities.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    <>
                      {filteredCities.map((city) => (
                        <div
                          key={city.id}
                          onClick={() => handleCitySelect(city.name)}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                            selectedCity === city.name ? "bg-blue-100" : ""
                          }`}
                        >
                          {city.name}
                        </div>
                      ))}
                      <div
                        onClick={() => handleCitySelect("سایر")}
                        className={`px-4 py-2 cursor-pointer hover:bg-blue-50 border-t border-gray-200 ${
                          selectedCity === "سایر" ? "bg-blue-100" : ""
                        }`}
                      >
                        سایر
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-center">
                      شهر یافت نشد
                      <div
                        onClick={() => handleCitySelect("سایر")}
                        className="mt-2 px-4 py-2 cursor-pointer hover:bg-blue-50 border-t border-gray-200"
                      >
                        سایر
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* فیلد وارد کردن شهر دیگر */}
            {(selectedCity === "سایر" || isOtherSelected || customCity) && (
              <input
                type="text"
                value={customCity}
                onChange={handleCustomCityChange}
                placeholder="نام شهر را وارد کنید"
                required={!!(required && (selectedCity === "سایر" || isOtherSelected))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mt-2"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
